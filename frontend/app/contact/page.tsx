'use client';

import { useState } from 'react';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';
import { TextField as AppleTextField } from '@/components/apple-ui/TextField/TextField';

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inquiryTypes = {
    general: { label: 'General Inquiry', icon: '💬', team: 'Support Team' },
    technical: {
      label: 'Technical Support',
      icon: '🔧',
      team: 'Technical Team',
    },
    sales: { label: 'Sales & Pricing', icon: '💼', team: 'Sales Team' },
    research: {
      label: 'Research Partnership',
      icon: '🔬',
      team: 'Research Team',
    },
    billing: { label: 'Billing Issue', icon: '💳', team: 'Billing Team' },
    feedback: { label: 'Product Feedback', icon: '💡', team: 'Product Team' },
  };

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer:
        'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
    },
    {
      question: 'What are the system requirements?',
      answer:
        'VQMethod works on any modern browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled.',
    },
    {
      question: 'Can I export my research data?',
      answer:
        'Yes, you can export data in multiple formats including CSV, Excel, SPSS, and R.',
    },
    {
      question: 'Is there a free trial available?',
      answer:
        'Yes, we offer a 14-day free trial with full access to all features.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        organization: '',
        subject: '',
        message: '',
      });
      setShowSuccess(false);
    }, 3000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We're here to help with your Q-methodology research needs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <AppleCard className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>

              {/* Inquiry Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  What can we help you with?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(inquiryTypes).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setInquiryType(key)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        inquiryType === key
                          ? 'border-system-blue bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Your message will be routed to:{' '}
                  <span className="font-medium">
                    {
                      inquiryTypes[inquiryType as keyof typeof inquiryTypes]
                        .team
                    }
                  </span>
                </p>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AppleTextField
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                  <AppleTextField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <AppleTextField
                  label="Organization (Optional)"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="University or Company"
                />

                <AppleTextField
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief description of your inquiry"
                  required
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent dark:bg-gray-700 resize-none"
                    placeholder="Please provide details about your inquiry..."
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Response time: Within 24 hours
                  </p>
                  <AppleButton
                    type="submit"
                    variant="primary"
                    size="large"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </AppleButton>
                </div>
              </form>

              {/* Success Message */}
              {showSuccess && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Message sent successfully! We'll get back to you soon.
                    </p>
                  </div>
                </div>
              )}
            </AppleCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Contact</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-system-blue mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      support@vqmethod.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-system-blue mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +1 (555) 123-4567
                    </p>
                    <p className="text-xs text-gray-500">
                      Mon-Fri, 9am-6pm PST
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-system-blue mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Office</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      123 Research Way
                      <br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>
              </div>
            </AppleCard>

            {/* Live Chat */}
            <AppleCard className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Live Chat</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get instant help from our support team
              </p>
              <AppleButton 
                variant="primary" 
                className="w-full"
                onClick={() => {
                  // Open chat support (could open a modal, redirect to chat page, or open external chat)
                  window.open('/support/chat', '_blank');
                }}
              >
                Start Chat
              </AppleButton>
            </AppleCard>

            {/* FAQ */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details key={index} className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{faq.question}</p>
                        <svg
                          className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </summary>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-0">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
              <a
                href="/help"
                className="block mt-4 text-sm text-system-blue hover:underline"
              >
                View all FAQs →
              </a>
            </AppleCard>

            {/* Office Hours */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Office Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Monday - Friday
                  </span>
                  <span className="font-medium">9:00 AM - 6:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Saturday
                  </span>
                  <span className="font-medium">10:00 AM - 4:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Sunday
                  </span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </AppleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
