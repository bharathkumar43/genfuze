import React, { useState } from 'react';
import { 
  Brain, 
  Search, 
  Target, 
  Zap, 
  BarChart3, 
  FileText, 
  Code, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Globe,
  BookOpen,
  Lightbulb,
  Shield,
  Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ContentStructureLanding() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Model Optimization",
      description: "Optimize your content specifically for AI models like ChatGPT, Gemini, and Perplexity",
      benefits: [
        "Better visibility in AI search results",
        "Improved content understanding by LLMs",
        "Enhanced citation likelihood",
        "Structured data for AI consumption"
      ]
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "SEO Enhancement",
      description: "Boost your search engine rankings with AI-powered content optimization",
      benefits: [
        "Structured data markup (JSON-LD)",
        "Meta descriptions and keywords",
        "Content readability scoring",
        "Heading hierarchy optimization"
      ]
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Smart Suggestions",
      description: "Get actionable recommendations to improve your content structure",
      benefits: [
        "Priority-based improvement suggestions",
        "Implementation guidance",
        "Impact assessment",
        "One-click content enhancement"
      ]
    }
  ];

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Increased Visibility",
      description: "Get discovered by AI models and search engines more effectively"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Better User Experience",
      description: "Improve readability and engagement with structured content"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Reach",
      description: "Optimize for multiple AI platforms and search engines"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Future-Proof",
      description: "Stay ahead of AI-driven content discovery trends"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Content Marketing Manager",
      company: "TechCorp",
      content: "Our content visibility in AI search results increased by 300% after using Genfuze.ai's structure analysis.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "SEO Specialist",
      company: "DigitalFlow",
      content: "The structured data generation feature alone improved our rich snippet appearances by 150%.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Content Creator",
      company: "CreativeHub",
      content: "The AI optimization suggestions helped me create content that performs better across all platforms.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                New Feature
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Optimize Your Content for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}AI Models
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your content to be more discoverable by AI models like ChatGPT, Gemini, and Perplexity. 
              Get better visibility, improved rankings, and enhanced user engagement.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/enhance-content')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Start Optimizing
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 transition-all duration-200"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Content Optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our advanced AI analyzes your content and provides specific recommendations 
              to improve visibility in AI models and search engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  activeFeature === index
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${
                  activeFeature === index ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Optimize for AI Models?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              AI models are becoming the primary way people discover content. 
              Optimize your content to stay ahead of the curve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <div className="text-blue-600">{benefit.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to optimize your content for AI models and search engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Content</h3>
              <p className="text-gray-600">
                Paste your content or provide URLs to crawl. Our AI will analyze the structure and identify improvement opportunities.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Analysis</h3>
              <p className="text-gray-600">
                Receive detailed scores for SEO, LLM optimization, and readability, along with specific improvement suggestions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Apply & Optimize</h3>
              <p className="text-gray-600">
                Apply suggestions automatically or manually, and download optimized content with structured data markup.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how content creators and marketers are improving their AI visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Optimize Your Content?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of content creators who are already improving their AI visibility with Genfuze.ai
          </p>
          <button
            onClick={() => navigate('/enhance-content')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Zap className="w-5 h-5" />
            Start Optimizing Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 