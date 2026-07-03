import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove unused type imports
content = re.sub(r'import { User, AuditLog } from \'./types\';', 'import { User } from \'./types\';', content)

# Remove unused Lucide imports
content = re.sub(r'import \{[\s\S]*?\} from \'lucide-react\';', 'import { LogOut } from \'lucide-react\';', content)

# Remove unused date-fns import
content = re.sub(r'import \{ format \} from \'date-fns\';\n', '', content)

# Remove unused React imports (useEffect)
content = re.sub(r'import \{ createContext, useContext, useState, useEffect \} from \'react\';', 'import { createContext, useContext, useState } from \'react\';', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

