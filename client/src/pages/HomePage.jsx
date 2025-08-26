import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Users, 
  Award, 
  BookOpen, 
  Clock, 
  Star, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { Button, Badge, Card } from '../components/ui';
import { useCategories } from '../hooks/useApi';

const HomePage = () => {
  const { getAllCategories, loading: categoriesLoading } = useCategories();
  const [courseCategories, setCourseCategories] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        // Take only the first 8 categories for the homepage
        setCourseCategories(categoriesData.slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default categories if API fails
        setCourseCategories([
          { id: 'programming-development', name: 'Programming & Development', description: 'Software development, coding, and programming languages' },
          { id: 'design-creative', name: 'Design & Creative', description: 'Graphic design, UI/UX, and creative arts' },
          { id: 'business-marketing', name: 'Business & Marketing', description: 'Business strategy, marketing, and entrepreneurship' },
          { id: 'data-science-analytics', name: 'Data Science & Analytics', description: 'Data analysis, machine learning, and statistics' }
        ]);
      }
    };

    fetchCategories();
  }, [getAllCategories]);

  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Learning',
      description: 'Access to thousands of courses across various subjects and skill levels.'
    },
    {
      icon: Clock,
      title: 'Learn at Your Pace',
      description: 'Study whenever and wherever you want with 24/7 access to all content.'
    },
    {
      icon: Award,
      title: 'Earn Certificates',
      description: 'Get recognized for your achievements with downloadable certificates.'
    },
    {
      icon: Users,
      title: 'Expert Instructors',
      description: 'Learn from industry professionals and certified experts in their fields.'
    },
    {
      icon: Shield,
      title: 'Quality Content',
      description: 'All courses are carefully curated and regularly updated for relevance.'
    },
    {
      icon: Zap,
      title: 'Interactive Learning',
      description: 'Engage with quizzes, assignments, and real-world projects.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Developer',
      company: 'TechCorp',
      content: 'LearnHub transformed my career. The courses are well-structured and the instructors are amazing. I landed my dream job within 6 months!',
      rating: 5,
      avatar: 'SJ'
    },
    {
      name: 'Michael Chen',
      role: 'Marketing Manager',
      company: 'Growth Inc',
      content: 'The business courses here are top-notch. I\'ve implemented strategies that increased our revenue by 40% in just one quarter.',
      rating: 5,
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      company: 'Design Studio',
      content: 'As a designer, I love the practical approach of these courses. The projects are real-world applicable and helped me build a strong portfolio.',
      rating: 5,
      avatar: 'ER'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Active Students', icon: Users },
    { number: '500+', label: 'Expert Instructors', icon: Award },
    { number: '10K+', label: 'Courses Available', icon: BookOpen },
    { number: '95%', label: 'Completion Rate', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="primary" className="mb-6">
                🎓 #1 Learning Platform
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Master New Skills with{' '}
                <span className="text-primary-600">Expert-Led</span> Courses
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join millions of learners worldwide and unlock your potential with our comprehensive 
                online courses. From beginner to advanced, we have everything you need to succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" as={Link} to="/courses">
                  Explore Courses
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" as={Link} to="/about">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
                  alt="Students learning online"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">50K+ Students</p>
                    <p className="text-xs text-gray-500">Already learning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose LearnHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide everything you need to accelerate your learning journey and achieve your goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <div className={`w-16 h-16 bg-${feature.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Popular Course Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our diverse range of courses designed to meet your learning needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courseCategories && courseCategories.length > 0 && courseCategories.map((category, index) => (
              <Card key={category._id} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <div className="text-4xl mb-4">{category.icon || '📚'}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" as={Link} to="/courses">
              View All Categories
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied learners who have transformed their careers with LearnHub.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary-700 font-semibold">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of learners and unlock your potential today. Start with a free course and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="white" size="lg" as={Link} to="/register">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" as={Link} to="/courses" className="border-white text-white hover:bg-white hover:text-primary-600">
              Browse Courses
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
