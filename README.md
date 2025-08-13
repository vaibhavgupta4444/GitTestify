# Test Case Generator

A comprehensive web application that integrates with GitHub to automatically generate intelligent test cases for your code repositories. Built with React, Next.js, and Node.js.

## 🚀 Features

### Core Functionality
- **GitHub Integration** - Secure OAuth authentication with GitHub
- **Repository Browser** - Browse and explore all your GitHub repositories
- **File Selection** - Interactive file tree with multi-select functionality for code files
- **AI-Powered Test Generation** - Intelligent analysis of code patterns to generate test case summaries
- **Multi-Framework Support** - Supports Jest, React Testing Library, pytest, JUnit, and more
- **Code Generation** - Generate complete, ready-to-use test code with proper imports and setup
- **GitHub PR Creation** - Automatically create pull requests with generated test files (Bonus Feature)

### Supported Test Frameworks
- **React/TypeScript**: Jest + React Testing Library
- **JavaScript/Node.js**: Jest with comprehensive test suites
- **Python**: pytest with fixtures and parameterized tests
- **Java**: JUnit 5 with modern testing patterns
- **Auto-detection**: Intelligent framework selection based on file types

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Next.js 14** - Full-stack React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible UI components
- **Lucide React** - Modern icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **GitHub REST API** - Repository and file management
- **OAuth 2.0** - Secure GitHub authentication

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub account
- GitHub OAuth App (for authentication)

## ⚙️ Setup Instructions

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd test-case-generator
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. GitHub OAuth App Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Test Case Generator
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback`
4. Save the Client ID and Client Secret

### 4. Environment Variables
Create a `.env.local` file in the root directory:

\`\`\`env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key

# Optional: Custom Port
PORT=3000
\`\`\`

### 5. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to access the application.

## 🎯 Usage Guide

### 1. Authentication
- Click "Sign in with GitHub" to authenticate
- Grant necessary permissions for repository access

### 2. Repository Selection
- Browse your GitHub repositories in the "Repositories" tab
- Select a repository to explore its files

### 3. File Selection
- Navigate through the file tree in the "Files" tab
- Select multiple code files using checkboxes
- Only code files (.js, .ts, .tsx, .py, .java, etc.) are selectable

### 4. Test Generation
- Go to the "Generate Tests" tab
- Click "Generate Test Cases" to analyze selected files
- Review the generated test case summaries with:
  - Test framework recommendations
  - Priority levels (High/Medium/Low)
  - Test types (Unit/Integration/Component)
  - Detailed descriptions

### 5. Code Generation
- Select any test case summary
- Click "Generate Code" to create complete test files
- Copy or download the generated test code
- Code includes proper imports, setup, and comprehensive test cases

### 6. GitHub PR Creation (Bonus)
- After generating test code, click "Create PR"
- Fill in PR details (title, description, branch name)
- Automatically creates a new branch and commits test files
- Opens a pull request with all generated tests

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout user

### GitHub Integration
- `GET /api/github/repositories` - Fetch user repositories
- `GET /api/github/files` - Get repository file tree
- `GET /api/github/file-content` - Fetch file contents

### Test Generation
- `POST /api/generate-tests` - Generate test case summaries
- `POST /api/generate-test-code` - Generate actual test code

### PR Creation
- `POST /api/github/create-pr` - Create GitHub pull request

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET` 
   - `NEXTAUTH_SECRET`
4. Update GitHub OAuth app callback URL to your Vercel domain
5. Deploy!

### Environment Variables for Production
\`\`\`env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_production_secret
\`\`\`

## 🎨 UI/UX Features

- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark Mode Support** - Automatic theme detection
- **Loading States** - Smooth loading indicators throughout the app
- **Error Handling** - Comprehensive error messages and recovery
- **Syntax Highlighting** - Beautiful code display with proper formatting
- **Copy to Clipboard** - Easy code copying functionality
- **File Type Icons** - Visual file type identification
- **Progress Tracking** - Clear workflow progression indicators

## 🔧 Development

### Project Structure
\`\`\`
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application
├── components/            # React components
├── lib/                   # Utility functions
├── public/               # Static assets
└── README.md             # This file
\`\`\`

### Key Components
- **AuthProvider** - GitHub authentication management
- **RepositorySelector** - Repository browsing and selection
- **FileBrowser** - File tree navigation with selection
- **TestGeneration** - Test case generation and management
- **PRCreation** - Pull request creation interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- GitHub API for repository integration
- shadcn/ui for beautiful components
- Next.js team for the amazing framework
- React Testing Library for testing inspiration

---

**Built with ❤️ using React, Next.js, and TypeScript**
