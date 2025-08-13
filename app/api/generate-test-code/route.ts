"use client"

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { summary, repository } = await request.json()

    if (!summary) {
      return NextResponse.json({ error: "No test summary provided" }, { status: 400 })
    }

    // Fetch the original file content
    const response = await fetch(`https://api.github.com/repos/${repository}/contents/${summary.file}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${summary.file}`)
    }

    const data = await response.json()
    const content = Buffer.from(data.content, "base64").toString("utf-8")

    // Generate test code based on the summary and file content
    const testCode = generateTestCode(summary, content)

    return NextResponse.json({
      testCode,
      fileName: getTestFileName(summary.file, summary.framework),
    })
  } catch (error) {
    console.error("Test code generation error:", error)
    return NextResponse.json({ error: "Failed to generate test code" }, { status: 500 })
  }
}

function getTestFileName(originalFile: string, framework: string): string {
  const baseName =
    originalFile
      .split("/")
      .pop()
      ?.replace(/\.(tsx|jsx|ts|js|py|java)$/, "") || "test"

  if (framework.includes("Jest")) {
    return `${baseName}.test.js`
  } else if (framework.includes("pytest")) {
    return `test_${baseName}.py`
  } else if (framework.includes("JUnit")) {
    return `${baseName}Test.java`
  }

  return `${baseName}.test.js`
}

function generateTestCode(summary: any, originalContent: string): string {
  const framework = summary.framework.toLowerCase()

  if (framework.includes("jest") && framework.includes("react")) {
    return generateReactTestCode(summary, originalContent)
  } else if (framework.includes("jest")) {
    return generateJestTestCode(summary, originalContent)
  } else if (framework.includes("pytest")) {
    return generatePytestCode(summary, originalContent)
  } else if (framework.includes("junit")) {
    return generateJUnitCode(summary, originalContent)
  }

  return generateGenericTestCode(summary, originalContent)
}

function generateReactTestCode(summary: any, content: string): string {
  const componentName =
    summary.file
      .split("/")
      .pop()
      ?.replace(/\.(tsx|jsx)$/, "") || "Component"
  const importPath = summary.file.replace(/\.(tsx|jsx)$/, "")

  let testCode = `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ${componentName} from './${importPath}';

describe('${componentName}', () => {`

  if (summary.id.includes("render")) {
    testCode += `
  test('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('displays expected content', () => {
    render(<${componentName} />);
    // Add specific content assertions based on your component
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });`
  }

  if (summary.id.includes("props")) {
    testCode += `
  test('handles props correctly', () => {
    const mockProps = {
      title: 'Test Title',
      onClick: jest.fn()
    };
    render(<${componentName} {...mockProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('handles missing props gracefully', () => {
    render(<${componentName} />);
    // Component should render with default values
    expect(screen.getByRole('main')).toBeInTheDocument();
  });`
  }

  if (summary.id.includes("events")) {
    testCode += `
  test('handles click events', () => {
    const mockHandler = jest.fn();
    render(<${componentName} onClick={mockHandler} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });`
  }

  if (summary.id.includes("state")) {
    testCode += `
  test('updates state correctly', () => {
    render(<${componentName} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Assert state change is reflected in UI
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });`
  }

  testCode += `
});`

  return testCode
}

function generateJestTestCode(summary: any, content: string): string {
  const moduleName =
    summary.file
      .split("/")
      .pop()
      ?.replace(/\.(ts|js)$/, "") || "module"
  const importPath = summary.file.replace(/\.(ts|js)$/, "")

  // Extract function names from content
  const functionMatches = content.match(/export\s+(?:function\s+(\w+)|const\s+(\w+))/g) || []
  const functions = functionMatches.map((match) => {
    const nameMatch = match.match(/(\w+)$/)
    return nameMatch ? nameMatch[1] : "testFunction"
  })

  let testCode = `import { ${functions.join(", ")} } from './${importPath}';

describe('${moduleName}', () => {`

  functions.forEach((funcName) => {
    testCode += `
  describe('${funcName}', () => {
    test('should work with valid input', () => {
      const result = ${funcName}('test input');
      expect(result).toBeDefined();
    });

    test('should handle edge cases', () => {
      expect(() => ${funcName}(null)).not.toThrow();
      expect(() => ${funcName}(undefined)).not.toThrow();
    });
  });`
  })

  if (summary.id.includes("async")) {
    testCode += `
  test('handles async operations', async () => {
    const result = await ${functions[0] || "asyncFunction"}();
    expect(result).toBeDefined();
  });

  test('handles async errors', async () => {
    await expect(${functions[0] || "asyncFunction"}('invalid')).rejects.toThrow();
  });`
  }

  testCode += `
});`

  return testCode
}

function generatePytestCode(summary: any, content: string): string {
  const moduleName = summary.file.replace(".py", "").replace("/", ".")
  const fileName = summary.file.split("/").pop()?.replace(".py", "") || "module"

  let testCode = `import pytest
from ${moduleName} import *

class Test${fileName.charAt(0).toUpperCase() + fileName.slice(1)}:`

  if (summary.id.includes("functions")) {
    testCode += `
    def test_function_with_valid_input(self):
        # Test with valid input
        result = your_function("valid_input")
        assert result is not None
        
    def test_function_with_invalid_input(self):
        # Test with invalid input
        with pytest.raises(ValueError):
            your_function(None)`
  }

  if (summary.id.includes("classes")) {
    testCode += `
    def test_class_initialization(self):
        # Test class can be instantiated
        instance = YourClass()
        assert instance is not None
        
    def test_class_methods(self):
        # Test class methods
        instance = YourClass()
        result = instance.method()
        assert result is not None`
  }

  if (summary.id.includes("selenium")) {
    testCode += `
    def test_web_element_interaction(self, driver):
        # Test web element interactions
        driver.get("https://example.com")
        element = driver.find_element(By.ID, "test-element")
        element.click()
        assert "expected" in driver.page_source`
  }

  return testCode
}

function generateJUnitCode(summary: any, content: string): string {
  const className = summary.file.split("/").pop()?.replace(".java", "") || "TestClass"

  let testCode = `import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class ${className}Test {
    
    private ${className} ${className.toLowerCase()};
    
    @BeforeEach
    void setUp() {
        ${className.toLowerCase()} = new ${className}();
    }`

  if (summary.id.includes("junit")) {
    testCode += `
    @Test
    @DisplayName("Should test basic functionality")
    void testBasicFunctionality() {
        // Arrange
        String input = "test";
        
        // Act
        String result = ${className.toLowerCase()}.method(input);
        
        // Assert
        assertNotNull(result);
        assertEquals("expected", result);
    }
    
    @Test
    @DisplayName("Should handle null input")
    void testNullInput() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            ${className.toLowerCase()}.method(null);
        });
    }`
  }

  if (summary.id.includes("spring")) {
    testCode += `
    @Test
    @DisplayName("Should test Spring integration")
    void testSpringIntegration() {
        // Test Spring-specific functionality
        assertTrue(${className.toLowerCase()}.isConfigured());
    }`
  }

  testCode += `
}`

  return testCode
}

function generateGenericTestCode(summary: any, content: string): string {
  return `// Generated test for ${summary.title}
// Framework: ${summary.framework}
// Type: ${summary.type}

describe('${summary.title}', () => {
  test('should pass basic test', () => {
    // TODO: Implement test logic based on requirements
    expect(true).toBe(true);
  });
  
  test('should handle edge cases', () => {
    // TODO: Add edge case testing
    expect(true).toBe(true);
  });
});`
}
