import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required for seeding")
}

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const adminPasswordHash = await bcrypt.hash("Admin123!", 12)
  const instructorPasswordHash = await bcrypt.hash("Instructor123!", 12)
  const studentPasswordHash = await bcrypt.hash("Student123!", 12)

  console.log(
    "Passwords: admin=Admin123!, instructor=Instructor123!, student=Student123!"
  )
  console.log("Cleaning existing courses/enrollments...")
  await prisma.quizAttempt.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.enrolment.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.module.deleteMany()
  await prisma.course.deleteMany()
  console.log("Clean slate ready.")

  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@lms.com",
      fullName: "Admin User",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  })

  const instructors = []
  const instructorData = [
    { email: "instructor@lms.com", name: "Jane Instructor" },
    { email: "instructor2@lms.com", name: "Dr. Sarah Chen" },
    { email: "marcus.park@lms.com", name: "Marcus Park" },
    { email: "emma.rodriguez@lms.com", name: "Emma Rodriguez" },
    { email: "james.wilson@lms.com", name: "James Wilson" },
    { email: "lisa.thompson@lms.com", name: "Lisa Thompson" },
    { email: "alex.kumar@lms.com", name: "Alex Kumar" },
    { email: "rachel.green@lms.com", name: "Rachel Green" },
  ]

  for (const data of instructorData) {
    const instructor = await prisma.user.upsert({
      where: { email: data.email },
      update: { passwordHash: instructorPasswordHash },
      create: {
        email: data.email,
        fullName: data.name,
        passwordHash: instructorPasswordHash,
        role: "INSTRUCTOR",
      },
    })
    instructors.push(instructor)
  }

  const students = []
  const studentData = [
    { email: "student@lms.com", name: "John Student" },
    { email: "student2@lms.com", name: "Alice Johnson" },
    { email: "bob.smith@lms.com", name: "Bob Smith" },
    { email: "carol.davis@lms.com", name: "Carol Davis" },
    { email: "david.lee@lms.com", name: "David Lee" },
    { email: "eve.martinez@lms.com", name: "Eve Martinez" },
    { email: "frank.nguyen@lms.com", name: "Frank Nguyen" },
    { email: "grace.oh@lms.com", name: "Grace Oh" },
    { email: "henry.patel@lms.com", name: "Henry Patel" },
    { email: "iris.chen@lms.com", name: "Iris Chen" },
    { email: "jack.williams@lms.com", name: "Jack Williams" },
    { email: "kate.brown@lms.com", name: "Kate Brown" },
  ]

  for (const data of studentData) {
    const student = await prisma.user.upsert({
      where: { email: data.email },
      update: { passwordHash: studentPasswordHash },
      create: {
        email: data.email,
        fullName: data.name,
        passwordHash: studentPasswordHash,
        role: "STUDENT",
      },
    })
    students.push(student)
  }

  console.log(
    `Created: 1 admin, ${instructors.length} instructors, ${students.length} students`
  )

  // --- Course Data ---
  const coursesData = [
    {
      title: "Introduction to Web Development",
      slug: "intro-to-web-dev",
      description:
        "Learn HTML, CSS, and JavaScript fundamentals from scratch. Build your first website and understand how the web works.",
      level: "BEGINNER" as const,
      category: "Web Development",
      tags: ["html", "css", "javascript"],
      price: 0,
      instructorIndex: 0,
      modules: [
        {
          title: "Getting Started",
          lessons: [
            {
              title: "Welcome to Web Development",
              content:
                "<h2>Welcome!</h2><p>In this course you will learn the fundamentals of web development including HTML, CSS, and JavaScript.</p>",
              contentType: "text",
              duration: 15,
              order: 1,
            },
            {
              title: "Setting Up Your Environment",
              content:
                "<h2>Environment Setup</h2><p>Install VS Code, Node.js, and set up your development environment for web development.</p>",
              contentType: "text",
              duration: 20,
              order: 2,
            },
            {
              title: "How the Web Works",
              content:
                "<h2>How the Web Works</h2><p>Understanding HTTP, browsers, servers, DNS, and the request-response cycle.</p>",
              contentType: "text",
              duration: 25,
              order: 3,
            },
          ],
        },
        {
          title: "HTML Fundamentals",
          lessons: [
            {
              title: "HTML Document Structure",
              content:
                "<h2>HTML Structure</h2><p>Learn about DOCTYPE, html, head, and body tags. Understanding the skeleton of every web page.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "Text and Links",
              content:
                "<h2>Text & Links</h2><p>Working with headings, paragraphs, bold, italic, and anchor tags for navigation.</p>",
              contentType: "text",
              duration: 15,
              order: 2,
            },
            {
              title: "Images and Media",
              content:
                "<h2>Images & Media</h2><p>Embedding images, videos, and audio in your web pages.</p>",
              contentType: "text",
              duration: 15,
              order: 3,
            },
            {
              title: "Forms and Input",
              content:
                "<h2>Forms</h2><p>Creating forms with text inputs, dropdowns, checkboxes, radio buttons, and submit buttons.</p>",
              contentType: "text",
              duration: 25,
              order: 4,
            },
          ],
        },
        {
          title: "CSS Styling",
          lessons: [
            {
              title: "CSS Basics & Selectors",
              content:
                "<h2>CSS Basics</h2><p>Understanding CSS syntax, selectors, properties, and the cascade.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Box Model & Layout",
              content:
                "<h2>Box Model</h2><p>Understanding margin, border, padding, content area. Display property and positioning.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
            {
              title: "Flexbox Layout",
              content:
                "<h2>Flexbox</h2><p>Mastering flexbox for creating flexible and responsive layouts.</p>",
              contentType: "text",
              duration: 30,
              order: 3,
            },
            {
              title: "Responsive Design",
              content:
                "<h2>Responsive Design</h2><p>Media queries, mobile-first design, and responsive images.</p>",
              contentType: "text",
              duration: 20,
              order: 4,
            },
          ],
        },
        {
          title: "JavaScript Basics",
          lessons: [
            {
              title: "Variables and Data Types",
              content:
                "<h2>Variables</h2><p>Learn about let, const, strings, numbers, booleans, null, and undefined.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Functions and Scope",
              content:
                "<h2>Functions</h2><p>Function declarations, expressions, arrow functions, and scope rules.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
            {
              title: "DOM Manipulation",
              content:
                "<h2>DOM Manipulation</h2><p>Selecting elements, modifying content, adding/removing classes, and event listeners.</p>",
              contentType: "text",
              duration: 35,
              order: 3,
            },
            {
              title: "Building a Todo App",
              content:
                "<h2>Todo App Project</h2><p>Put everything together by building a complete todo application with HTML, CSS, and JavaScript.</p>",
              contentType: "text",
              duration: 45,
              order: 4,
            },
          ],
        },
      ],
    },
    {
      title: "Python for Data Science",
      slug: "python-data-science",
      description:
        "Master Python programming for data analysis, visualization, and machine learning. From basics to advanced pandas and numpy.",
      level: "INTERMEDIATE" as const,
      category: "Data Science",
      tags: ["python", "data-science", "machine-learning"],
      price: 49.99,
      instructorIndex: 1,
      modules: [
        {
          title: "Python Fundamentals",
          lessons: [
            {
              title: "Python Overview & Setup",
              content:
                "<h2>Python Setup</h2><p>Installing Python, setting up Jupyter notebooks, and writing your first Python code.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "Variables & Data Types",
              content:
                "<h2>Data Types</h2><p>Numbers, strings, lists, tuples, dictionaries, and sets in Python.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
            {
              title: "Control Flow",
              content:
                "<h2>Control Flow</h2><p>If/else statements, for loops, while loops, and comprehensions.</p>",
              contentType: "text",
              duration: 25,
              order: 3,
            },
          ],
        },
        {
          title: "NumPy & Pandas",
          lessons: [
            {
              title: "NumPy Arrays",
              content:
                "<h2>NumPy</h2><p>Creating and manipulating NumPy arrays, broadcasting, and mathematical operations.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "Pandas DataFrames",
              content:
                "<h2>Pandas</h2><p>Loading data, DataFrames, Series, filtering, grouping, and aggregation.</p>",
              contentType: "text",
              duration: 40,
              order: 2,
            },
            {
              title: "Data Cleaning",
              content:
                "<h2>Data Cleaning</h2><p>Handling missing values, duplicates, data types, and outliers.</p>",
              contentType: "text",
              duration: 30,
              order: 3,
            },
          ],
        },
        {
          title: "Data Visualization",
          lessons: [
            {
              title: "Matplotlib Basics",
              content:
                "<h2>Matplotlib</h2><p>Creating line plots, bar charts, histograms, and scatter plots.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Seaborn for Statistical Plots",
              content:
                "<h2>Seaborn</h2><p>Statistical visualization, heatmaps, pair plots, and categorical plots.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
          ],
        },
        {
          title: "Introduction to Machine Learning",
          lessons: [
            {
              title: "What is Machine Learning?",
              content:
                "<h2>ML Overview</h2><p>Supervised vs unsupervised learning, regression vs classification.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "Linear Regression",
              content:
                "<h2>Linear Regression</h2><p>Building your first ML model with scikit-learn.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
            {
              title: "Classification with Scikit-Learn",
              content:
                "<h2>Classification</h2><p>Logistic regression, decision trees, and model evaluation.</p>",
              contentType: "text",
              duration: 40,
              order: 3,
            },
          ],
        },
      ],
    },
    {
      title: "Advanced React Patterns",
      slug: "advanced-react-patterns",
      description:
        "Master advanced React patterns including hooks, context, render props, higher-order components, and performance optimization.",
      level: "ADVANCED" as const,
      category: "Web Development",
      tags: ["react", "javascript", "frontend"],
      price: 79.99,
      instructorIndex: 0,
      modules: [
        {
          title: "Advanced Hooks",
          lessons: [
            {
              title: "Custom Hooks Deep Dive",
              content:
                "<h2>Custom Hooks</h2><p>Building reusable custom hooks for form handling, data fetching, and state management.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "useReducer & Complex State",
              content:
                "<h2>useReducer</h2><p>Managing complex state logic with useReducer and combining with context.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
            {
              title: "useMemo & useCallback",
              content:
                "<h2>Performance Hooks</h2><p>Optimizing re-renders with useMemo, useCallback, and React.memo.</p>",
              contentType: "text",
              duration: 25,
              order: 3,
            },
          ],
        },
        {
          title: "Component Patterns",
          lessons: [
            {
              title: "Compound Components",
              content:
                "<h2>Compound Components</h2><p>Building flexible component APIs with the compound component pattern.</p>",
              contentType: "text",
              duration: 40,
              order: 1,
            },
            {
              title: "Render Props & HOCs",
              content:
                "<h2>Render Props</h2><p>Understanding render props and higher-order components for code reuse.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
            {
              title: "Headless Components",
              content:
                "<h2>Headless Components</h2><p>Separating logic from presentation with headless component patterns.</p>",
              contentType: "text",
              duration: 30,
              order: 3,
            },
          ],
        },
      ],
    },
    {
      title: "UI/UX Design Systems",
      slug: "ui-ux-design-systems",
      description:
        "Learn to build scalable design systems with Figma, component libraries, design tokens, and documentation that teams love.",
      level: "INTERMEDIATE" as const,
      category: "Design",
      tags: ["design", "figma", "ui", "ux"],
      price: 59.99,
      instructorIndex: 2,
      modules: [
        {
          title: "Design System Fundamentals",
          lessons: [
            {
              title: "What is a Design System?",
              content:
                "<h2>Design Systems</h2><p>Understanding the value of design systems for teams and products.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "Design Tokens",
              content:
                "<h2>Design Tokens</h2><p>Colors, typography, spacing, and shadows as tokens. Managing tokens across platforms.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
            {
              title: "Component Architecture",
              content:
                "<h2>Components</h2><p>Atomic design methodology, component variants, and states.</p>",
              contentType: "text",
              duration: 30,
              order: 3,
            },
          ],
        },
        {
          title: "Building in Figma",
          lessons: [
            {
              title: "Figma Components & Variants",
              content:
                "<h2>Figma Components</h2><p>Creating master components, variants, and auto-layout in Figma.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "Design System Documentation",
              content:
                "<h2>Documentation</h2><p>Creating living documentation with usage guidelines and code examples.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Cloud Architecture with AWS",
      slug: "cloud-architecture-aws",
      description:
        "Design and deploy scalable cloud infrastructure using AWS services. Learn EC2, S3, Lambda, RDS, and best practices.",
      level: "ADVANCED" as const,
      category: "Cloud Computing",
      tags: ["aws", "cloud", "devops"],
      price: 89.99,
      instructorIndex: 3,
      modules: [
        {
          title: "AWS Core Services",
          lessons: [
            {
              title: "AWS Overview & Account Setup",
              content:
                "<h2>AWS Setup</h2><p>Setting up your AWS account, understanding regions, availability zones, and the AWS console.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "EC2 & Compute",
              content:
                "<h2>EC2</h2><p>Launching instances, security groups, key pairs, and SSH access.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
            {
              title: "S3 & Storage",
              content:
                "<h2>S3</h2><p>Buckets, objects, permissions, lifecycle policies, and static website hosting.</p>",
              contentType: "text",
              duration: 30,
              order: 3,
            },
          ],
        },
        {
          title: "Serverless & Databases",
          lessons: [
            {
              title: "Lambda Functions",
              content:
                "<h2>Lambda</h2><p>Creating serverless functions, triggers, and the serverless mindset.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "RDS & DynamoDB",
              content:
                "<h2>Databases</h2><p>Relational databases with RDS and NoSQL with DynamoDB.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
          ],
        },
        {
          title: "Architecture Best Practices",
          lessons: [
            {
              title: "Well-Architected Framework",
              content:
                "<h2>Well-Architected</h2><p>The five pillars: operational excellence, security, reliability, performance, cost optimization.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "CI/CD Pipeline",
              content:
                "<h2>CI/CD</h2><p>Building deployment pipelines with CodePipeline, CodeBuild, and CodeDeploy.</p>",
              contentType: "text",
              duration: 40,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Digital Marketing Essentials",
      slug: "digital-marketing-essentials",
      description:
        "Learn SEO, social media marketing, content strategy, email marketing, and analytics to grow any business online.",
      level: "BEGINNER" as const,
      category: "Marketing",
      tags: ["marketing", "seo", "social-media"],
      price: 29.99,
      instructorIndex: 4,
      modules: [
        {
          title: "Marketing Foundations",
          lessons: [
            {
              title: "Digital Marketing Overview",
              content:
                "<h2>Digital Marketing</h2><p>Understanding the digital marketing landscape, channels, and strategy.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "SEO Fundamentals",
              content:
                "<h2>SEO</h2><p>Keyword research, on-page optimization, link building, and technical SEO basics.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
            {
              title: "Content Marketing",
              content:
                "<h2>Content Marketing</h2><p>Creating valuable content, content calendars, and measuring content success.</p>",
              contentType: "text",
              duration: 25,
              order: 3,
            },
          ],
        },
        {
          title: "Social Media & Paid Ads",
          lessons: [
            {
              title: "Social Media Strategy",
              content:
                "<h2>Social Media</h2><p>Platform selection, content planning, engagement, and community building.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Google Ads & Facebook Ads",
              content:
                "<h2>Paid Advertising</h2><p>Setting up campaigns, targeting, bidding strategies, and measuring ROI.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
            {
              title: "Email Marketing",
              content:
                "<h2>Email Marketing</h2><p>Building email lists, crafting campaigns, automation, and A/B testing.</p>",
              contentType: "text",
              duration: 20,
              order: 3,
            },
          ],
        },
      ],
    },
    {
      title: "Machine Learning with TensorFlow",
      slug: "machine-learning-tensorflow",
      description:
        "Build real-world ML models using TensorFlow and Keras. From neural networks to CNNs and NLP applications.",
      level: "ADVANCED" as const,
      category: "Data Science",
      tags: ["machine-learning", "tensorflow", "deep-learning"],
      price: 99.99,
      instructorIndex: 1,
      modules: [
        {
          title: "Neural Network Fundamentals",
          lessons: [
            {
              title: "Perceptrons & Neural Networks",
              content:
                "<h2>Neural Networks</h2><p>Understanding neurons, layers, activation functions, and forward propagation.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Backpropagation & Training",
              content:
                "<h2>Training</h2><p>Loss functions, gradient descent, backpropagation, and optimization algorithms.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
          ],
        },
        {
          title: "TensorFlow & Keras",
          lessons: [
            {
              title: "TensorFlow Basics",
              content:
                "<h2>TensorFlow</h2><p>Tensors, operations, variables, and the TensorFlow computational graph.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Building Models with Keras",
              content:
                "<h2>Keras</h2><p>Sequential and functional APIs, compiling, training, and evaluating models.</p>",
              contentType: "text",
              duration: 40,
              order: 2,
            },
            {
              title: "Convolutional Neural Networks",
              content:
                "<h2>CNNs</h2><p>Image classification with CNNs, data augmentation, and transfer learning.</p>",
              contentType: "text",
              duration: 45,
              order: 3,
            },
          ],
        },
        {
          title: "Advanced Topics",
          lessons: [
            {
              title: "Natural Language Processing",
              content:
                "<h2>NLP</h2><p>Text preprocessing, word embeddings, RNNs, LSTMs, and transformer architectures.</p>",
              contentType: "text",
              duration: 40,
              order: 1,
            },
            {
              title: "Model Deployment",
              content:
                "<h2>Deployment</h2><p>Saving models, serving with TensorFlow Serving, and deploying to production.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Mobile App Development with React Native",
      slug: "react-native-mobile",
      description:
        "Build cross-platform mobile apps for iOS and Android using React Native. From setup to publishing on app stores.",
      level: "INTERMEDIATE" as const,
      category: "Mobile Development",
      tags: ["react-native", "mobile", "javascript"],
      price: 69.99,
      instructorIndex: 5,
      modules: [
        {
          title: "React Native Setup",
          lessons: [
            {
              title: "Environment Setup",
              content:
                "<h2>Setup</h2><p>Installing React Native CLI, setting up simulators, and creating your first app.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Core Components",
              content:
                "<h2>Components</h2><p>View, Text, Image, ScrollView, FlatList, and TouchableOpacity.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
            {
              title: "Styling with StyleSheet",
              content:
                "<h2>Styling</h2><p>Flexbox in React Native, platform-specific styles, and responsive design.</p>",
              contentType: "text",
              duration: 20,
              order: 3,
            },
          ],
        },
        {
          title: "Navigation & State",
          lessons: [
            {
              title: "React Navigation",
              content:
                "<h2>Navigation</h2><p>Stack, tab, and drawer navigation with React Navigation library.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "State Management",
              content:
                "<h2>State</h2><p>Using Context, useReducer, and integrating with external state libraries.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Cybersecurity Fundamentals",
      slug: "cybersecurity-fundamentals",
      description:
        "Learn essential cybersecurity concepts including threat analysis, network security, encryption, and ethical hacking basics.",
      level: "BEGINNER" as const,
      category: "Cybersecurity",
      tags: ["security", "hacking", "networking"],
      price: 39.99,
      instructorIndex: 6,
      modules: [
        {
          title: "Security Basics",
          lessons: [
            {
              title: "Introduction to Cybersecurity",
              content:
                "<h2>Cybersecurity</h2><p>Understanding the threat landscape, attack vectors, and defense strategies.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Network Security",
              content:
                "<h2>Network Security</h2><p>Firewalls, IDS/IPS, VPNs, and securing network infrastructure.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
            {
              title: "Encryption & Cryptography",
              content:
                "<h2>Cryptography</h2><p>Symmetric vs asymmetric encryption, hashing, digital signatures, and PKI.</p>",
              contentType: "text",
              duration: 35,
              order: 3,
            },
          ],
        },
        {
          title: "Ethical Hacking",
          lessons: [
            {
              title: "Reconnaissance & Scanning",
              content:
                "<h2>Recon</h2><p>Information gathering, port scanning, and vulnerability assessment.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Web Application Security",
              content:
                "<h2>Web Security</h2><p>OWASP Top 10, SQL injection, XSS, CSRF, and secure coding practices.</p>",
              contentType: "text",
              duration: 40,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Agile Project Management",
      slug: "agile-project-management",
      description:
        "Master Scrum methodology, sprint planning, retrospectives, and team collaboration tools for modern software projects.",
      level: "BEGINNER" as const,
      category: "Business",
      tags: ["agile", "scrum", "management"],
      price: 0,
      instructorIndex: 3,
      modules: [
        {
          title: "Agile Principles",
          lessons: [
            {
              title: "What is Agile?",
              content:
                "<h2>Agile</h2><p>The Agile Manifesto, principles, and how it differs from waterfall methodology.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "Scrum Framework",
              content:
                "<h2>Scrum</h2><p>Roles (Product Owner, Scrum Master, Team), events, and artifacts.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
            {
              title: "User Stories & Backlog",
              content:
                "<h2>User Stories</h2><p>Writing effective user stories, estimation with story points, and backlog grooming.</p>",
              contentType: "text",
              duration: 20,
              order: 3,
            },
          ],
        },
        {
          title: "Sprint Execution",
          lessons: [
            {
              title: "Sprint Planning & Execution",
              content:
                "<h2>Sprints</h2><p>Planning sprints, daily standups, burndown charts, and managing impediments.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Retrospectives & Improvement",
              content:
                "<h2>Retros</h2><p>Running effective retrospectives and continuous improvement.</p>",
              contentType: "text",
              duration: 15,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Node.js Backend Development",
      slug: "nodejs-backend",
      description:
        "Build scalable backend applications with Node.js, Express, and MongoDB. REST APIs, authentication, and deployment.",
      level: "INTERMEDIATE" as const,
      category: "Web Development",
      tags: ["nodejs", "express", "backend", "api"],
      price: 54.99,
      instructorIndex: 5,
      modules: [
        {
          title: "Node.js Essentials",
          lessons: [
            {
              title: "Node.js Architecture",
              content:
                "<h2>Node.js</h2><p>Event loop, non-blocking I/O, and the V8 engine. Setting up your first Node.js project.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Express.js Framework",
              content:
                "<h2>Express</h2><p>Routing, middleware, request/response handling, and error handling.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
            {
              title: "REST API Design",
              content:
                "<h2>REST APIs</h2><p>Designing RESTful APIs, CRUD operations, status codes, and API versioning.</p>",
              contentType: "text",
              duration: 35,
              order: 3,
            },
          ],
        },
        {
          title: "Database & Authentication",
          lessons: [
            {
              title: "MongoDB with Mongoose",
              content:
                "<h2>MongoDB</h2><p>Connecting to MongoDB, schemas, models, CRUD operations, and aggregation.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "Authentication & JWT",
              content:
                "<h2>Auth</h2><p>User registration, login, password hashing, JWT tokens, and protected routes.</p>",
              contentType: "text",
              duration: 40,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Data Visualization with D3.js",
      slug: "data-visualization-d3",
      description:
        "Create stunning interactive data visualizations for the web using D3.js. Charts, maps, dashboards, and animations.",
      level: "INTERMEDIATE" as const,
      category: "Data Science",
      tags: ["d3", "visualization", "javascript", "charts"],
      price: 44.99,
      instructorIndex: 7,
      modules: [
        {
          title: "D3.js Basics",
          lessons: [
            {
              title: "SVG & D3 Selections",
              content:
                "<h2>D3 Basics</h2><p>Understanding SVG elements, D3 selections, data binding, and the enter-update-exit pattern.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Scales & Axes",
              content:
                "<h2>Scales</h2><p>Linear, ordinal, time scales. Creating axes and responsive charts.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
          ],
        },
        {
          title: "Chart Types",
          lessons: [
            {
              title: "Bar Charts & Line Charts",
              content:
                "<h2>Basic Charts</h2><p>Building interactive bar charts and line charts with tooltips and transitions.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "Maps & Geospatial Data",
              content:
                "<h2>Maps</h2><p>Geo projections, choropleth maps, and interactive geographic visualizations.</p>",
              contentType: "text",
              duration: 40,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Blockchain & Web3 Development",
      slug: "blockchain-web3",
      description:
        "Understand blockchain technology and build decentralized applications with Solidity, Ethereum, and Web3.js.",
      level: "ADVANCED" as const,
      category: "Web Development",
      tags: ["blockchain", "ethereum", "solidity", "web3"],
      price: 94.99,
      instructorIndex: 6,
      modules: [
        {
          title: "Blockchain Fundamentals",
          lessons: [
            {
              title: "How Blockchain Works",
              content:
                "<h2>Blockchain</h2><p>Distributed ledgers, consensus mechanisms, blocks, and chains.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Ethereum & Smart Contracts",
              content:
                "<h2>Ethereum</h2><p>Understanding Ethereum, gas, transactions, and the EVM.</p>",
              contentType: "text",
              duration: 30,
              order: 2,
            },
          ],
        },
        {
          title: "Solidity Development",
          lessons: [
            {
              title: "Solidity Basics",
              content:
                "<h2>Solidity</h2><p>Variables, functions, modifiers, events, and contract structure.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "Building a DApp",
              content:
                "<h2>DApps</h2><p>Connecting smart contracts to a frontend with Web3.js and MetaMask.</p>",
              contentType: "text",
              duration: 45,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Photography Masterclass",
      slug: "photography-masterclass",
      description:
        "Learn professional photography from composition and lighting to post-processing. Master your camera and editing workflow.",
      level: "BEGINNER" as const,
      category: "Photography",
      tags: ["photography", "creative", "editing"],
      price: 34.99,
      instructorIndex: 7,
      modules: [
        {
          title: "Camera Basics",
          lessons: [
            {
              title: "Understanding Your Camera",
              content:
                "<h2>Camera Basics</h2><p>Exposure triangle: aperture, shutter speed, ISO. Shooting modes.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Composition Rules",
              content:
                "<h2>Composition</h2><p>Rule of thirds, leading lines, framing, symmetry, and visual balance.</p>",
              contentType: "text",
              duration: 20,
              order: 2,
            },
          ],
        },
        {
          title: "Lighting & Post-Processing",
          lessons: [
            {
              title: "Natural & Studio Lighting",
              content:
                "<h2>Lighting</h2><p>Working with natural light, reflectors, and basic studio setups.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Editing with Lightroom",
              content:
                "<h2>Lightroom</h2><p>Importing, organizing, developing, and exporting your photos.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "TypeScript Deep Dive",
      slug: "typescript-deep-dive",
      description:
        "Go beyond the basics of TypeScript. Learn advanced types, generics, decorators, and build type-safe applications.",
      level: "INTERMEDIATE" as const,
      category: "Web Development",
      tags: ["typescript", "javascript", "programming"],
      price: 49.99,
      instructorIndex: 0,
      modules: [
        {
          title: "Type System Deep Dive",
          lessons: [
            {
              title: "Advanced Types",
              content:
                "<h2>Advanced Types</h2><p>Union, intersection, conditional, mapped, and template literal types.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Generics Masterclass",
              content:
                "<h2>Generics</h2><p>Generic functions, classes, constraints, and inference.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
          ],
        },
        {
          title: "Practical TypeScript",
          lessons: [
            {
              title: "Type-Safe APIs",
              content:
                "<h2>Type-Safe APIs</h2><p>Typing API responses, Zod validation, and runtime type checking.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Decorators & Metadata",
              content:
                "<h2>Decorators</h2><p>Class decorators, method decorators, and reflect-metadata.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Kubernetes & Container Orchestration",
      slug: "kubernetes-orchestration",
      description:
        "Master Kubernetes for container orchestration. Deploy, scale, and manage containerized applications in production.",
      level: "ADVANCED" as const,
      category: "Cloud Computing",
      tags: ["kubernetes", "docker", "devops", "containers"],
      price: 84.99,
      instructorIndex: 3,
      modules: [
        {
          title: "Docker & Containers",
          lessons: [
            {
              title: "Docker Fundamentals",
              content:
                "<h2>Docker</h2><p>Images, containers, Dockerfile, and Docker Compose basics.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Containerizing Applications",
              content:
                "<h2>Containerization</h2><p>Multi-stage builds, environment variables, and optimizing images.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
          ],
        },
        {
          title: "Kubernetes Core",
          lessons: [
            {
              title: "Pods, Services & Deployments",
              content:
                "<h2>K8s Core</h2><p>Understanding pods, services, deployments, and ConfigMaps.</p>",
              contentType: "text",
              duration: 40,
              order: 1,
            },
            {
              title: "Ingress & Networking",
              content:
                "<h2>Networking</h2><p>Ingress controllers, network policies, and service mesh basics.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
            {
              title: "Helm Charts",
              content:
                "<h2>Helm</h2><p>Package management with Helm, creating charts, and managing releases.</p>",
              contentType: "text",
              duration: 30,
              order: 3,
            },
          ],
        },
      ],
    },
    {
      title: "Product Management Essentials",
      slug: "product-management",
      description:
        "Learn to define product strategy, prioritize features, run experiments, and drive product-led growth.",
      level: "BEGINNER" as const,
      category: "Business",
      tags: ["product", "management", "strategy"],
      price: 0,
      instructorIndex: 4,
      modules: [
        {
          title: "Product Strategy",
          lessons: [
            {
              title: "Product Thinking",
              content:
                "<h2>Product Thinking</h2><p>Understanding user problems, jobs-to-be-done, and value propositions.</p>",
              contentType: "text",
              duration: 20,
              order: 1,
            },
            {
              title: "Roadmapping & Prioritization",
              content:
                "<h2>Roadmaps</h2><p>Creating roadmaps, RICE scoring, and stakeholder alignment.</p>",
              contentType: "text",
              duration: 25,
              order: 2,
            },
          ],
        },
        {
          title: "Execution & Growth",
          lessons: [
            {
              title: "Sprints & Experiments",
              content:
                "<h2>Sprints</h2><p>Running product sprints, A/B testing, and data-driven decisions.</p>",
              contentType: "text",
              duration: 25,
              order: 1,
            },
            {
              title: "Metrics & Analytics",
              content:
                "<h2>Metrics</h2><p>Key metrics (DAU, retention, NPS), dashboards, and reporting.</p>",
              contentType: "text",
              duration: 20,
              order: 2,
            },
          ],
        },
      ],
    },
    {
      title: "Flutter App Development",
      slug: "flutter-app-development",
      description:
        "Build beautiful natively compiled apps for mobile, web, and desktop from a single Dart codebase with Flutter.",
      level: "INTERMEDIATE" as const,
      category: "Mobile Development",
      tags: ["flutter", "dart", "mobile"],
      price: 59.99,
      instructorIndex: 5,
      modules: [
        {
          title: "Flutter Basics",
          lessons: [
            {
              title: "Dart Language Overview",
              content:
                "<h2>Dart</h2><p>Dart syntax, types, null safety, async/await, and collections.</p>",
              contentType: "text",
              duration: 30,
              order: 1,
            },
            {
              title: "Widgets & Layout",
              content:
                "<h2>Widgets</h2><p>StatelessWidget, StatefulWidget, Row, Column, Stack, and Container.</p>",
              contentType: "text",
              duration: 35,
              order: 2,
            },
            {
              title: "Navigation & Routing",
              content:
                "<h2>Navigation</h2><p>Navigator, named routes, passing data between screens, and deep linking.</p>",
              contentType: "text",
              duration: 25,
              order: 3,
            },
          ],
        },
        {
          title: "Advanced Flutter",
          lessons: [
            {
              title: "State Management with Riverpod",
              content:
                "<h2>Riverpod</h2><p>Providers, StateNotifier, async providers, and state best practices.</p>",
              contentType: "text",
              duration: 35,
              order: 1,
            },
            {
              title: "Networking & Firebase",
              content:
                "<h2>Backend</h2><p>HTTP requests, JSON parsing, Firebase Auth, and Firestore integration.</p>",
              contentType: "text",
              duration: 40,
              order: 2,
            },
          ],
        },
      ],
    },
  ]

  // --- Create Courses ---
  console.log(`Creating ${coursesData.length} courses...`)
  const createdCourses = []

  for (const courseData of coursesData) {
    try {
      const course = await prisma.course.create({
        data: {
          title: courseData.title,
          slug: courseData.slug,
          description: courseData.description,
          level: courseData.level,
          isPublished: true,
          instructorId: instructors[courseData.instructorIndex].id,
          category: courseData.category,
          tags: courseData.tags,
          price: courseData.price,
          modules: {
            create: courseData.modules.map((mod, mi) => ({
              title: mod.title,
              order: mi + 1,
              lessons: {
                create: mod.lessons.map((lesson) => ({
                  title: lesson.title,
                  content: lesson.content,
                  contentType: lesson.contentType,
                  duration: lesson.duration,
                  order: lesson.order,
                })),
              },
            })),
          },
        },
      })
      createdCourses.push(course)
      console.log(`  Created: ${courseData.title}`)
    } catch (error) {
      console.error(`  Error creating ${courseData.title}:`, error)
    }
  }

  // --- Create Enrollments ---
  console.log("Creating enrollments...")
  for (let i = 0; i < students.length; i++) {
    const numCourses = 3 + Math.floor(Math.random() * 4)
    for (let j = 0; j < numCourses; j++) {
      const courseIdx = (i * 3 + j) % createdCourses.length
      try {
        const progress = Math.floor(Math.random() * 100)
        await prisma.enrolment.create({
          data: {
            userId: students[i].id,
            courseId: createdCourses[courseIdx].id,
            status: progress >= 100 ? "COMPLETED" : "ACTIVE",
            progress,
            lastAccessedAt: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ),
            completedAt: progress >= 100 ? new Date() : null,
          },
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : ""
        if (!message.includes("Unique constraint"))
          console.error("Enrollment error:", err)
      }
    }
  }

  // --- Create Quizzes ---
  console.log("Creating quizzes...")
  for (let c = 0; c < Math.min(8, createdCourses.length); c++) {
    const course = createdCourses[c]
    const quiz = await prisma.quiz.create({
      data: {
        title: `${course.title} - Assessment`,
        description: `Test your knowledge of ${course.title}`,
        courseId: course.id,
        timeLimit: 30,
        attemptsAllowed: 3,
        questions: {
          create: [
            {
              text: "Which of the following best describes the main topic covered in this course?",
              type: "MC_SINGLE",
              points: 10,
              options: [
                "Option A - Core concept",
                "Option B - Related concept",
                "Option C - Unrelated",
                "Option D - Opposite",
              ],
              correctAnswer: { correct: 0 },
            },
            {
              text: "What is the recommended approach for implementing the techniques learned?",
              type: "MC_SINGLE",
              points: 10,
              options: [
                "Hands-on practice",
                "Reading only",
                "Watching videos only",
                "Memorization",
              ],
              correctAnswer: { correct: 0 },
            },
            {
              text: "Which best practice should be followed when applying these concepts?",
              type: "MC_SINGLE",
              points: 10,
              options: [
                "Start with simple examples",
                "Jump to complex projects",
                "Skip fundamentals",
                "Copy without understanding",
              ],
              correctAnswer: { correct: 0 },
            },
            {
              text: "What are the key benefits of mastering this subject?",
              type: "MC_MULTI",
              points: 15,
              options: [
                "Career advancement",
                "Problem-solving skills",
                "Unnecessary complexity",
                "Industry recognition",
              ],
              correctAnswer: { correct: [0, 1, 3] },
            },
            {
              text: "Explain in your own words the most important concept from this course.",
              type: "TEXT",
              points: 20,
              options: [],
              correctAnswer: {},
            },
          ],
        },
      },
    })
  }

  // --- Create Assignments ---
  console.log("Creating assignments...")
  for (let c = 0; c < Math.min(6, createdCourses.length); c++) {
    const course = createdCourses[c]
    await prisma.assignment.create({
      data: {
        title: `${course.title} - Practical Project`,
        description: `Apply what you've learned in ${course.title} by completing a hands-on project. Submit your work as a text answer describing your approach, implementation, and key takeaways.`,
        courseId: course.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxPoints: 100,
      },
    })
  }

  // --- Create Notifications ---
  console.log("Creating notifications...")
  const notifTypes = ["info", "success", "warning"]
  const notifMessages = [
    {
      title: "Welcome to LMSio!",
      message: "Your account has been set up. Start exploring courses today.",
      type: "info",
    },
    {
      title: "New Course Available",
      message:
        "Check out our latest courses in Web Development and Data Science.",
      type: "info",
    },
    {
      title: "Assignment Due Soon",
      message: "You have an assignment due in 3 days. Don't forget to submit!",
      type: "warning",
    },
    {
      title: "Course Completed!",
      message:
        "Congratulations on completing your course! Keep up the great work.",
      type: "success",
    },
    {
      title: "Quiz Results Available",
      message: "Your quiz results are ready. Check your performance now.",
      type: "info",
    },
    {
      title: "New Feature: Learning Paths",
      message:
        "Explore curated learning paths to guide your education journey.",
      type: "info",
    },
  ]

  for (const student of students) {
    for (const msg of notifMessages) {
      await prisma.notification.create({
        data: {
          userId: student.id,
          title: msg.title,
          message: msg.message,
          type: msg.type,
          read: Math.random() > 0.5,
        },
      })
    }
  }

  // --- Create Badges ---
  console.log("Creating badges...")
  const badgesData = [
    {
      name: "First Course",
      slug: "first-course",
      description: "Enrolled in your first course",
      iconUrl: "/badges/first-course.svg",
      points: 10,
      criteria: { type: "enrollment_count", value: 1 },
    },
    {
      name: "Quick Learner",
      slug: "quick-learner",
      description: "Completed 3 courses",
      iconUrl: "/badges/quick-learner.svg",
      points: 25,
      criteria: { type: "completion_count", value: 3 },
    },
    {
      name: "Quiz Master",
      slug: "quiz-master",
      description: "Scored 90%+ on 5 quizzes",
      iconUrl: "/badges/quiz-master.svg",
      points: 50,
      criteria: { type: "quiz_score", value: 90, count: 5 },
    },
    {
      name: "Consistent Scholar",
      slug: "consistent-scholar",
      description: "Logged in 30 days in a row",
      iconUrl: "/badges/streak.svg",
      points: 100,
      criteria: { type: "login_streak", value: 30 },
    },
  ]

  for (const badge of badgesData) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: badge,
    })
  }

  // --- Create Settings ---
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      siteName: "LMSio",
      siteDescription: "Modern Learning Management Platform",
      allowRegistration: true,
      defaultRole: "STUDENT",
      maintenanceMode: false,
      maxUploadSize: 20,
      emailNotifications: true,
    },
  })

  console.log(
    `Seed complete! Created ${createdCourses.length} courses, quizzes, assignments, notifications, and badges.`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
