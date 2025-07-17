const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'sessions.db');
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database.');
          resolve();
        }
      });
    });
  }

  // User Management Methods
  async createOrUpdateUser(userData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        INSERT OR REPLACE INTO users 
        (id, email, name, display_name, tenant_id, roles, is_active, last_login_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(query, [
        userData.id,
        userData.email,
        userData.name,
        userData.displayName,
        userData.tenantId,
        JSON.stringify(userData.roles),
        1, // is_active
        new Date().toISOString(),
        new Date().toISOString()
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Create user for local authentication
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        INSERT INTO users 
        (id, email, name, display_name, password, tenant_id, roles, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(query, [
        userData.id,
        userData.email,
        userData.name,
        userData.displayName,
        userData.password,
        userData.tenantId || null,
        JSON.stringify(userData.roles),
        userData.isActive ? 1 : 0,
        userData.createdAt,
        userData.updatedAt
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Update user last login
  async updateUserLastLogin(userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        UPDATE users 
        SET last_login_at = ?, updated_at = ?
        WHERE id = ?
      `;

      this.db.run(query, [
        new Date().toISOString(),
        new Date().toISOString(),
        userId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async getUserById(userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'SELECT * FROM users WHERE id = ?';
      
      this.db.get(query, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            row.roles = JSON.parse(row.roles || '["user"]');
          }
          resolve(row);
        }
      });
    });
  }

  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'SELECT * FROM users WHERE email = ?';
      
      this.db.get(query, [email], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            roles: JSON.parse(row.roles || '["user"]')
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async saveUserSession(userId, refreshToken, expiresAt) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const sessionId = require('crypto').randomUUID();
      const query = `
        INSERT INTO user_sessions 
        (id, user_id, refresh_token, expires_at)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(query, [sessionId, userId, refreshToken, expiresAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getUserSessionByRefreshToken(refreshToken) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'SELECT * FROM user_sessions WHERE refresh_token = ?';
      
      this.db.get(query, [refreshToken], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async deleteUserSession(refreshToken) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'DELETE FROM user_sessions WHERE refresh_token = ?';
      
      this.db.run(query, [refreshToken], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async deleteExpiredUserSessions() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'DELETE FROM user_sessions WHERE expires_at < ?';
      const now = new Date().toISOString();
      
      this.db.run(query, [now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Private method for saving session without transaction (for bulk operations)
  async _saveSessionWithoutTransaction(sessionData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      // Insert session
      const sessionStmt = this.db.prepare(`
        INSERT INTO sessions 
        (id, user_id, name, type, timestamp, model, question_provider, question_model, answer_provider, answer_model, blog_content, blog_url, source_urls, crawl_mode, crawled_pages, total_input_tokens, total_output_tokens)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sessionStmt.run([
        sessionData.id,
        sessionData.userId,
        sessionData.name,
        sessionData.type,
        sessionData.timestamp,
        sessionData.model,
        sessionData.questionProvider || null,
        sessionData.questionModel || null,
        sessionData.answerProvider || null,
        sessionData.answerModel || null,
        sessionData.blogContent,
        sessionData.blogUrl,
        sessionData.sourceUrls ? JSON.stringify(sessionData.sourceUrls) : null,
        sessionData.crawlMode || null,
        sessionData.crawledPages ? JSON.stringify(sessionData.crawledPages) : null,
        sessionData.totalInputTokens,
        sessionData.totalOutputTokens
      ], (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Insert session statistics
      const statsStmt = this.db.prepare(`
        INSERT INTO session_statistics 
        (session_id, total_questions, avg_accuracy, total_cost)
        VALUES (?, ?, ?, ?)
      `);

      // Defensive checks for statistics
      const stats = sessionData.statistics || {};
      statsStmt.run([
        sessionData.id,
        typeof stats.totalQuestions === 'number' ? stats.totalQuestions : 0,
        typeof stats.avgAccuracy === 'number' ? stats.avgAccuracy : 0,
        typeof stats.totalCost === 'number' ? stats.totalCost : 0
      ], (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Insert QA data
      const qaStmt = this.db.prepare(`
        INSERT INTO qa_data 
        (session_id, question, answer, accuracy, sentiment, input_tokens, output_tokens, total_tokens, cost, question_order, embedding, question_embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Defensive check for qaData
      const qaArray = Array.isArray(sessionData.qaData) ? sessionData.qaData : [];
      qaArray.forEach((qa, index) => {
        qaStmt.run([
          sessionData.id,
          qa.question || '',
          qa.answer || '',
          qa.accuracy || '',
          qa.sentiment || '',
          qa.inputTokens || 0,
          qa.outputTokens || 0,
          qa.totalTokens || 0,
          qa.cost || 0,
          index,
          qa.embedding ? JSON.stringify(qa.embedding) : null,
          qa.questionEmbedding ? JSON.stringify(qa.questionEmbedding) : null
        ], (err) => {
          if (err) {
            reject(err);
            return;
          }
        });
      });

      resolve(sessionData.id);
    });
  }

  // Updated Session Management Methods
  async saveSession(sessionData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        this._saveSessionWithoutTransaction(sessionData)
          .then((result) => {
            this.db.run('COMMIT', (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
              } else {
                resolve(result);
              }
            });
          })
          .catch((error) => {
            this.db.run('ROLLBACK');
            reject(error);
          });
      });
    });
  }

  async getSessionsByType(type, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT s.*, ss.total_questions, ss.avg_accuracy, ss.total_cost
        FROM sessions s
        LEFT JOIN session_statistics ss ON s.id = ss.session_id
        WHERE s.type = ? AND s.user_id = ?
        ORDER BY s.timestamp DESC
      `;

      this.db.all(query, [type, userId], async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const sessions = [];
          for (const row of rows) {
            const qaData = await this.getQADataBySessionId(row.id);
            sessions.push({
              id: row.id,
              name: row.name,
              type: row.type,
              timestamp: row.timestamp,
              model: row.model,
              questionProvider: row.question_provider,
              questionModel: row.question_model,
              answerProvider: row.answer_provider,
              answerModel: row.answer_model,
              blogContent: row.blog_content,
              blogUrl: row.blog_url,
              sourceUrls: row.source_urls ? JSON.parse(row.source_urls) : undefined,
              crawlMode: row.crawl_mode,
              crawledPages: row.crawled_pages ? JSON.parse(row.crawled_pages) : undefined,
              totalInputTokens: row.total_input_tokens,
              totalOutputTokens: row.total_output_tokens,
              qaData,
              statistics: {
                totalQuestions: row.total_questions,
                avgAccuracy: row.avg_accuracy,
                totalCost: row.total_cost
              }
            });
          }
          resolve(sessions);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async getSessionsByTypeWithFilters(type, userId, filters) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      let query = `
        SELECT s.*, ss.total_questions, ss.avg_accuracy, ss.total_cost
        FROM sessions s
        LEFT JOIN session_statistics ss ON s.id = ss.session_id
        WHERE s.type = ? AND s.user_id = ?
      `;

      const params = [type, userId];
      const conditions = [];

      // Date range filters
      if (filters.fromDate) {
        conditions.push('s.timestamp >= ?');
        params.push(filters.fromDate);
      }

      if (filters.toDate) {
        conditions.push('s.timestamp <= ?');
        params.push(filters.toDate + 'T23:59:59');
      }

      // LLM Provider filter
      if (filters.llmProvider) {
        if (type === 'question') {
          conditions.push('s.question_provider = ?');
        } else {
          conditions.push('s.answer_provider = ?');
        }
        params.push(filters.llmProvider);
      }

      // LLM Model filter
      if (filters.llmModel) {
        if (type === 'question') {
          conditions.push('s.question_model = ?');
        } else {
          conditions.push('s.answer_model = ?');
        }
        params.push(filters.llmModel);
      }

      // Blog link filter (search in source_urls JSON and blog_url)
      if (filters.blogLink) {
        conditions.push(`(
          s.blog_url LIKE ? OR 
          s.source_urls LIKE ?
        )`);
        const searchPattern = `%${filters.blogLink}%`;
        params.push(searchPattern, searchPattern);
      }

      // Search filter (for date/time text search)
      if (filters.search) {
        conditions.push('s.timestamp LIKE ?');
        params.push(`%${filters.search}%`);
      }

      // Add conditions to query
      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += ' ORDER BY s.timestamp DESC';

      this.db.all(query, params, async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const sessions = [];
          for (const row of rows) {
            // Additional client-side filtering for source_urls JSON search
            if (filters.blogLink && row.source_urls) {
              try {
                const sourceUrls = JSON.parse(row.source_urls);
                const hasMatchingUrl = sourceUrls.some(url => 
                  url.toLowerCase().includes(filters.blogLink.toLowerCase())
                );
                if (!hasMatchingUrl) {
                  continue; // Skip this session if no matching URL found
                }
              } catch (e) {
                // If JSON parsing fails, skip this session
                continue;
              }
            }

            const qaData = await this.getQADataBySessionId(row.id);
            sessions.push({
              id: row.id,
              name: row.name,
              type: row.type,
              timestamp: row.timestamp,
              model: row.model,
              questionProvider: row.question_provider,
              questionModel: row.question_model,
              answerProvider: row.answer_provider,
              answerModel: row.answer_model,
              blogContent: row.blog_content,
              blogUrl: row.blog_url,
              sourceUrls: row.source_urls ? JSON.parse(row.source_urls) : undefined,
              crawlMode: row.crawl_mode,
              crawledPages: row.crawled_pages ? JSON.parse(row.crawled_pages) : undefined,
              totalInputTokens: row.total_input_tokens,
              totalOutputTokens: row.total_output_tokens,
              qaData,
              statistics: {
                totalQuestions: row.total_questions,
                avgAccuracy: row.avg_accuracy,
                totalCost: row.total_cost
              }
            });
          }
          resolve(sessions);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async getSessionById(sessionId, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT s.*, ss.total_questions, ss.avg_accuracy, ss.total_cost
        FROM sessions s
        LEFT JOIN session_statistics ss ON s.id = ss.session_id
        WHERE s.id = ? AND s.user_id = ?
      `;

      this.db.get(query, [sessionId, userId], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        try {
          const qaData = await this.getQADataBySessionId(row.id);
          resolve({
            id: row.id,
            name: row.name,
            type: row.type,
            timestamp: row.timestamp,
            model: row.model,
            questionProvider: row.question_provider,
            questionModel: row.question_model,
            answerProvider: row.answer_provider,
            answerModel: row.answer_model,
            blogContent: row.blog_content,
            blogUrl: row.blog_url,
            sourceUrls: row.source_urls ? JSON.parse(row.source_urls) : undefined,
            crawlMode: row.crawl_mode,
            crawledPages: row.crawled_pages ? JSON.parse(row.crawled_pages) : undefined,
            totalInputTokens: row.total_input_tokens,
            totalOutputTokens: row.total_output_tokens,
            qaData,
            statistics: {
              totalQuestions: row.total_questions,
              avgAccuracy: row.avg_accuracy,
              totalCost: row.total_cost
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async deleteSession(sessionId, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'DELETE FROM sessions WHERE id = ? AND user_id = ?';
      
      this.db.run(query, [sessionId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async getSessionCount(type, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'SELECT COUNT(*) as count FROM sessions WHERE type = ? AND user_id = ?';
      
      this.db.get(query, [type, userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.count : 0);
        }
      });
    });
  }

  // Get QA data for a specific session
  async getQADataBySessionId(sessionId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT 
          question, answer, accuracy, sentiment, 
          input_tokens, output_tokens, total_tokens, cost,
          question_embedding
        FROM qa_data 
        WHERE session_id = ? 
        ORDER BY question_order
      `;

      this.db.all(query, [sessionId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const qaData = rows.map(row => ({
          question: row.question,
          answer: row.answer,
          accuracy: row.accuracy,
          sentiment: row.sentiment,
          inputTokens: row.input_tokens,
          outputTokens: row.output_tokens,
          totalTokens: row.total_tokens,
          cost: row.cost,
          questionEmbedding: row.question_embedding ? JSON.parse(row.question_embedding) : null
        }));

        resolve(qaData);
      });
    });
  }

  // Bulk save sessions
  async bulkSaveSessions(sessions) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const results = [];
      let successful = 0;
      let failed = 0;

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        const processSession = (index) => {
          if (index >= sessions.length) {
            this.db.run('COMMIT', (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
              } else {
                resolve({
                  success: true,
                  results,
                  summary: {
                    total: sessions.length,
                    successful,
                    failed
                  }
                });
              }
            });
            return;
          }

          const sessionData = sessions[index];
          
          this._saveSessionWithoutTransaction(sessionData)
            .then(() => {
              results.push({ id: sessionData.id, success: true });
              successful++;
              processSession(index + 1);
            })
            .catch((error) => {
              results.push({ id: sessionData.id, success: false, error: error.message });
              failed++;
              processSession(index + 1);
            });
        };

        processSession(0);
      });
    });
  }

  // Vector similarity search methods
  // async findSimilarQuestions(questionEmbedding, userId, limit = 10, threshold = 0.7) {
  //   return new Promise((resolve, reject) => {
  //     if (!this.db) {
  //       reject(new Error('Database not connected'));
  //       return;
  //     }

  //     const query = `
  //       SELECT 
  //         qd.question, qd.answer, qd.accuracy, qd.sentiment,
  //         qd.input_tokens, qd.output_tokens, qd.total_tokens, qd.cost,
  //         qd.embedding, qd.question_embedding,
  //         s.name as session_name, s.timestamp as session_timestamp,
  //         s.blog_url, s.source_urls
  //       FROM qa_data qd
  //       JOIN sessions s ON qd.session_id = s.id
  //       WHERE s.user_id = ? AND qd.question_embedding IS NOT NULL
  //       ORDER BY question_order
  //     `;

  //     this.db.all(query, [userId], (err, rows) => {
  //       if (err) {
  //         reject(err);
  //         return;
  //       }

  //       try {
  //         const similarQuestions = [];
          
  //         for (const row of rows) {
  //           if (row.question_embedding) {
  //             const storedEmbedding = JSON.parse(row.question_embedding);
  //             const similarity = this.cosineSimilarity(questionEmbedding, storedEmbedding);
              
  //             if (similarity >= threshold) {
  //               similarQuestions.push({
  //                 question: row.question,
  //                 answer: row.answer,
  //                 accuracy: row.accuracy,
  //                 sentiment: row.sentiment,
  //                 inputTokens: row.input_tokens,
  //                 outputTokens: row.output_tokens,
  //                 totalTokens: row.total_tokens,
  //                 cost: row.cost,
  //                 embedding: row.embedding ? JSON.parse(row.embedding) : null,
  //                 questionEmbedding: storedEmbedding,
  //                 similarity,
  //                 sessionName: row.session_name,
  //                 sessionTimestamp: row.session_timestamp,
  //                 blogUrl: row.blog_url,
  //                 sourceUrls: row.source_urls ? JSON.parse(row.source_urls) : null
  //               });
  //             }
  //           }
  //         }

  //         // Sort by similarity (highest first) and limit results
  //         similarQuestions.sort((a, b) => b.similarity - a.similarity);
  //         resolve(similarQuestions.slice(0, limit));
  //       } catch (error) {
  //         reject(error);
  //       }
  //     });
  //   });
  // }

  // async findSimilarAnswers(answerEmbedding, userId, limit = 10, threshold = 0.7) {
  //   return new Promise((resolve, reject) => {
  //     if (!this.db) {
  //       reject(new Error('Database not connected'));
  //       return;
  //     }

  //     const query = `
  //       SELECT 
  //         qd.question, qd.answer, qd.accuracy, qd.sentiment,
  //         qd.input_tokens, qd.output_tokens, qd.total_tokens, qd.cost,
  //         qd.embedding, qd.question_embedding,
  //         s.name as session_name, s.timestamp as session_timestamp,
  //         s.blog_url, s.source_urls
  //       FROM qa_data qd
  //       JOIN sessions s ON qd.session_id = s.id
  //       WHERE s.user_id = ? AND qd.embedding IS NOT NULL
  //       ORDER BY question_order
  //     `;

  //     this.db.all(query, [userId], (err, rows) => {
  //       if (err) {
  //         reject(err);
  //         return;
  //       }

  //       try {
  //         const similarAnswers = [];
          
  //         for (const row of rows) {
  //           if (row.embedding) {
  //             const storedEmbedding = JSON.parse(row.embedding);
  //             const similarity = this.cosineSimilarity(answerEmbedding, storedEmbedding);
              
  //             if (similarity >= threshold) {
  //               similarAnswers.push({
  //                 question: row.question,
  //                 answer: row.answer,
  //                 accuracy: row.accuracy,
  //                 sentiment: row.sentiment,
  //                 inputTokens: row.input_tokens,
  //                 outputTokens: row.output_tokens,
  //                 totalTokens: row.total_tokens,
  //                 cost: row.cost,
  //                 embedding: storedEmbedding,
  //                 questionEmbedding: row.question_embedding ? JSON.parse(row.question_embedding) : null,
  //                 similarity,
  //                 sessionName: row.session_name,
  //                 sessionTimestamp: row.session_timestamp,
  //                 blogUrl: row.blog_url,
  //                 sourceUrls: row.source_urls ? JSON.parse(row.source_urls) : null
  //               });
  //             }
  //           }
  //         }

  //         // Sort by similarity (highest first) and limit results
  //         similarAnswers.sort((a, b) => b.similarity - a.similarity);
  //         resolve(similarAnswers.slice(0, limit));
  //       } catch (error) {
  //         reject(error);
  //       }
  //     });
  //   });
  // }

  // Find similar content based on content embeddings
  // async findSimilarContent(contentEmbedding, userId, limit = 10, threshold = 0.7) {
  //   return new Promise((resolve, reject) => {
  //     if (!this.db) {
  //       reject(new Error('Database not connected'));
  //       return;
  //     }

  //     const query = `
  //       SELECT 
  //         s.id, s.name as session_name, s.timestamp as session_timestamp,
  //         s.content, s.content_embedding, s.type
  //       FROM sessions s
  //       WHERE s.user_id = ? AND s.content_embedding IS NOT NULL
  //       ORDER BY s.timestamp DESC
  //     `;

  //     this.db.all(query, [userId], (err, rows) => {
  //       if (err) {
  //         reject(err);
  //         return;
  //       }

  //       try {
  //         const similarContent = [];
          
  //         for (const row of rows) {
  //           if (row.content_embedding) {
  //             const storedEmbedding = JSON.parse(row.content_embedding);
  //             const similarity = this.cosineSimilarity(contentEmbedding, storedEmbedding);
              
  //             if (similarity >= threshold) {
  //               similarContent.push({
  //                 sessionId: row.id,
  //                 sessionName: row.session_name,
  //                 sessionTimestamp: row.session_timestamp,
  //                 content: row.content,
  //                 contentEmbedding: storedEmbedding,
  //                 type: row.type,
  //                 similarity
  //               });
  //             }
  //           }
  //         }

  //         // Sort by similarity (highest first) and limit results
  //         similarContent.sort((a, b) => b.similarity - a.similarity);
  //         resolve(similarContent.slice(0, limit));
  //       } catch (error) {
  //         reject(error);
  //       }
  //     });
  //   });
  // }

  // Calculate cosine similarity between two vectors
  // cosineSimilarity(vecA, vecB) {
  //   if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
  //     return 0;
  //   }

  //   let dotProduct = 0;
  //   let normA = 0;
  //   let normB = 0;

  //   for (let i = 0; i < vecA.length; i++) {
  //     dotProduct += vecA[i] * vecB[i];
  //     normA += vecA[i] * vecA[i];
  //     normB += vecB[i] * vecB[i];
  //   }

  //   if (normA === 0 || normB === 0) {
  //     return 0;
  //   }

  //   return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // }

  // Competitor Analysis Methods
  async saveCompetitorAnalysis(analysisData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        INSERT INTO competitor_analyses 
        (id, user_id, domain, url, analysis, content_length, title, description, last_updated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(query, [
        analysisData.id,
        analysisData.userId,
        analysisData.domain,
        analysisData.url,
        JSON.stringify(analysisData.analysis),
        analysisData.contentLength,
        analysisData.title,
        analysisData.description,
        analysisData.lastUpdated,
        analysisData.createdAt
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getCompetitorAnalyses(userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT * FROM competitor_analyses 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      
      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const analyses = rows.map(row => ({
            ...row,
            analysis: JSON.parse(row.analysis || '{}')
          }));
          resolve(analyses);
        }
      });
    });
  }

  async getCompetitorAnalysis(id, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT * FROM competitor_analyses 
        WHERE id = ? AND user_id = ?
      `;
      
      this.db.get(query, [id, userId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            analysis: JSON.parse(row.analysis || '{}')
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async deleteCompetitorAnalysis(id, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        DELETE FROM competitor_analyses 
        WHERE id = ? AND user_id = ?
      `;
      
      this.db.run(query, [id, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Comprehensive Analysis Methods
  async saveComprehensiveAnalysis(analysisData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        INSERT INTO comprehensive_analyses 
        (id, user_id, domain, competitors, industry, total_competitors, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(query, [
        analysisData.id,
        analysisData.userId,
        analysisData.domain,
        JSON.stringify(analysisData.competitors),
        analysisData.industry,
        analysisData.totalCompetitors,
        analysisData.createdAt
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getComprehensiveAnalyses(userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT * FROM comprehensive_analyses 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      
      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const analyses = rows.map(row => ({
            ...row,
            competitors: JSON.parse(row.competitors || '[]')
          }));
          resolve(analyses);
        }
      });
    });
  }

  async getComprehensiveAnalysis(id, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT * FROM comprehensive_analyses 
        WHERE id = ? AND user_id = ?
      `;
      
      this.db.get(query, [id, userId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            competitors: JSON.parse(row.competitors || '[]')
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async deleteComprehensiveAnalysis(id, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        DELETE FROM comprehensive_analyses 
        WHERE id = ? AND user_id = ?
      `;
      
      this.db.run(query, [id, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Smart Analysis Methods
  async saveSmartAnalysis(analysisData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      const query = `
        INSERT INTO smart_analyses 
        (id, user_id, target_domain, target_analysis, competitors, user_position, total_analyzed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      this.db.run(query, [
        analysisData.id,
        analysisData.userId,
        analysisData.targetDomain,
        JSON.stringify(analysisData.targetAnalysis),
        JSON.stringify(analysisData.competitors),
        analysisData.userPosition,
        analysisData.totalAnalyzed,
        analysisData.createdAt
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getSmartAnalyses(userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      const query = `
        SELECT * FROM smart_analyses 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const analyses = rows.map(row => ({
            ...row,
            targetAnalysis: JSON.parse(row.target_analysis || '{}'),
            competitors: JSON.parse(row.competitors || '[]')
          }));
          resolve(analyses);
        }
      });
    });
  }

  async getSmartAnalysis(id, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      const query = `
        SELECT * FROM smart_analyses 
        WHERE id = ? AND user_id = ?
      `;
      this.db.get(query, [id, userId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            targetAnalysis: JSON.parse(row.target_analysis || '{}'),
            competitors: JSON.parse(row.competitors || '[]')
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async deleteSmartAnalysis(id, userId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      const query = `
        DELETE FROM smart_analyses 
        WHERE id = ? AND user_id = ?
      `;
      this.db.run(query, [id, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed.');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database; 