import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove sqlSchemaText
content = re.sub(r'const sqlSchemaText = `.*?`;\n', '', content, flags=re.DOTALL)

# Remove unused states and functions from App component
# We'll match from `const [currentTime` down to `  const login = `
app_body_start = r'const \[currentTime.*?const login = '
content = re.sub(app_body_start, 'const login = ', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
