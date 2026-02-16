---
title: "Claude Code MCP 서버 활용법 - 외부 도구와의 통합"
date: 2026-02-16T13:02:00+09:00
draft: false
tags: ["Claude Code", "MCP", "도구통합", "AI코딩"]
categories: ["Claude Code"]
series: "Claude Code"
description: "MCP(Model Context Protocol) 서버를 통해 Claude Code의 능력을 확장하는 방법을 알아봅니다"
---

## MCP란 무엇인가

MCP(Model Context Protocol)는 AI 모델과 외부 도구를 연결하는 표준 프로토콜입니다. Claude Code는 MCP를 통해 파일 시스템, 데이터베이스, 웹 API, 문서 검색 엔진 등 다양한 외부 서비스와 통합할 수 있습니다.

기본적으로 Claude Code는 코드 읽기, 쓰기, 실행 등의 기능을 제공하지만, MCP 서버를 추가하면 이러한 능력을 무한히 확장할 수 있습니다. 예를 들어, Context7 MCP 서버를 연결하면 최신 라이브러리 문서를 실시간으로 검색할 수 있고, Exa MCP 서버를 통해 웹 검색 결과를 활용할 수 있습니다.

## MCP 아키텍처

MCP는 클라이언트-서버 구조로 동작합니다.

```
Claude Code (클라이언트)
    ↕ MCP Protocol
MCP 서버 (filesystem, context7, exa 등)
    ↕ 각 서버의 프로토콜
외부 서비스 (파일시스템, API, 데이터베이스 등)
```

클라이언트인 Claude Code는 표준화된 MCP 프로토콜로 서버에 요청을 보내고, 각 MCP 서버는 자신이 연결된 외부 서비스에 맞는 방식으로 요청을 처리합니다. 이러한 추상화 덕분에 Claude Code는 각 서비스의 세부 구현을 몰라도 통일된 방식으로 다양한 도구를 사용할 수 있습니다.

## MCP 서버 설정하기

MCP 서버는 `.claude/settings.json` 파일에서 설정합니다.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-filesystem-server", "/home/user/projects"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "@exa/mcp-server"],
      "env": {
        "EXA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

각 서버 설정은 다음 요소로 구성됩니다.

- **command**: 실행할 명령어 (주로 npx 또는 node)
- **args**: 명령어 인자 (서버 패키지 이름과 옵션)
- **env**: 환경변수 (API 키 등)

설정을 저장하면 Claude Code는 세션 시작 시 자동으로 MCP 서버를 실행합니다.

## 주요 MCP 서버

### filesystem - 파일 시스템 접근

filesystem 서버는 특정 디렉토리에 대한 읽기/쓰기 권한을 제공합니다.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic-ai/mcp-filesystem-server",
        "/home/user/documents",
        "/home/user/projects"
      ]
    }
  }
}
```

제공하는 도구:
- `mcp__filesystem__read_file`: 파일 읽기
- `mcp__filesystem__write_file`: 파일 쓰기
- `mcp__filesystem__list_directory`: 디렉토리 목록 조회
- `mcp__filesystem__search_files`: 파일 검색

### context7 - 최신 문서 검색

context7 서버는 프로그래밍 라이브러리와 프레임워크의 최신 문서를 검색합니다.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

사용 예시:

```javascript
// Claude Code가 내부적으로 호출
// "React 18의 useTransition 훅 사용법을 알려줘"
// → mcp__context7__resolve-library-id("react")
// → mcp__context7__query-docs("/facebook/react", "useTransition hook usage")
```

이 서버는 공식 문서, GitHub README, 코드 예제를 통합하여 최신 정보를 제공합니다.

### exa - 웹 검색

exa 서버는 웹 검색 기능을 제공합니다.

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "@exa/mcp-server"],
      "env": {
        "EXA_API_KEY": "your-api-key"
      }
    }
  }
}
```

제공하는 도구:
- `mcp__exa__web_search_exa`: 일반 웹 검색
- `mcp__exa__company_research_exa`: 회사 정보 검색
- `mcp__exa__get_code_context_exa`: 코드 예제 검색

## MCP 도구 호출 방식

MCP 서버가 등록되면 Claude Code는 자동으로 해당 서버의 도구들을 인식합니다. 도구 이름은 `mcp__서버명__도구명` 패턴을 따릅니다.

```
mcp__filesystem__read_file
mcp__context7__query-docs
mcp__exa__web_search_exa
```

사용자가 직접 이 도구들을 호출할 필요는 없습니다. Claude Code가 문맥에 맞게 자동으로 선택하여 사용합니다.

예를 들어:
- "이 프로젝트의 package.json을 읽어줘" → filesystem 서버 사용
- "Next.js 15의 App Router 사용법" → context7 서버 사용
- "2026년 JavaScript 트렌드" → exa 서버 사용

## 커스텀 MCP 서버 만들기

자신만의 MCP 서버를 만들어 특정 API나 데이터베이스를 Claude Code와 연결할 수 있습니다.

### Node.js MCP 서버 예시

간단한 데이터베이스 조회 MCP 서버를 만들어보겠습니다.

```javascript
// db-mcp-server.js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const mysql = require('mysql2/promise');

const server = new Server(
  {
    name: 'database-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 데이터베이스 연결 풀
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 도구 목록 제공
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'query_users',
        description: 'Query users from the database',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of users to return',
            },
          },
        },
      },
      {
        name: 'get_user',
        description: 'Get a specific user by ID',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
              description: 'User ID',
            },
          },
          required: ['userId'],
        },
      },
    ],
  };
});

// 도구 실행 핸들러
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'query_users') {
    const limit = args.limit || 10;
    const [rows] = await pool.query('SELECT * FROM users LIMIT ?', [limit]);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }

  if (name === 'get_user') {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [args.userId]);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rows[0] || null, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### package.json 설정

```json
{
  "name": "db-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "db-mcp-server": "./db-mcp-server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "mysql2": "^3.6.0"
  }
}
```

### Claude Code에서 사용

```json
{
  "mcpServers": {
    "database": {
      "command": "node",
      "args": ["/path/to/db-mcp-server/db-mcp-server.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_USER": "root",
        "DB_PASSWORD": "password",
        "DB_NAME": "myapp"
      }
    }
  }
}
```

이제 Claude Code에서 "사용자 목록을 조회해줘"라고 요청하면 자동으로 `mcp__database__query_users` 도구를 호출합니다.

## 실전 활용 사례

### 사례 1: 문서 검색 통합

프로젝트에서 사용하는 라이브러리의 최신 문서를 실시간으로 참조할 수 있습니다.

```
사용자: "Prisma ORM에서 트랜잭션을 어떻게 사용하나요?"

Claude Code:
1. mcp__context7__resolve-library-id("prisma")
2. mcp__context7__query-docs("/prisma/prisma", "transaction usage")
3. 최신 공식 문서 기반으로 답변
```

이는 Claude의 지식 컷오프 날짜 이후에 나온 새로운 기능도 정확히 안내할 수 있게 합니다.

### 사례 2: 데이터베이스 스키마 분석

커스텀 MCP 서버를 통해 데이터베이스 스키마를 분석하고 마이그레이션을 생성할 수 있습니다.

```javascript
// "users 테이블에 verified_at 컬럼을 추가하는 마이그레이션을 만들어줘"
// → mcp__database__describe_table("users")
// → 현재 스키마 확인 후 마이그레이션 파일 생성
```

### 사례 3: CI/CD 파이프라인 연결

GitHub Actions나 Jenkins와 연결하여 빌드 상태를 확인하거나 배포를 트리거할 수 있습니다.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@github/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token"
      }
    }
  }
}
```

```
사용자: "최근 빌드가 실패한 이유를 분석해줘"

Claude Code:
1. mcp__github__get_workflow_runs()
2. 실패한 빌드 로그 분석
3. 원인 파악 및 수정 제안
```

## MCP 서버 디버깅

MCP 서버가 제대로 작동하지 않을 때는 다음을 확인하세요.

### 서버 로그 확인

```bash
# MCP 서버 직접 실행하여 에러 확인
node /path/to/mcp-server.js
```

### settings.json 문법 검증

JSON 문법 오류가 있으면 서버가 로드되지 않습니다. JSON 검증기로 확인하세요.

### 환경변수 확인

API 키 등 필수 환경변수가 올바르게 설정되었는지 확인합니다.

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "@exa/mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    }
  }
}
```

시스템 환경변수를 참조하려면 `${변수명}` 형식을 사용합니다.

## 마무리

MCP는 Claude Code의 능력을 무한히 확장할 수 있는 강력한 메커니즘입니다. 파일 시스템, 문서 검색, 웹 API, 데이터베이스 등 필요한 모든 외부 도구를 표준화된 방식으로 연결할 수 있습니다.

기본 제공되는 MCP 서버들을 활용하는 것부터 시작하여, 점차 프로젝트에 특화된 커스텀 MCP 서버를 만들어보세요. 이를 통해 Claude Code는 단순한 코드 편집기를 넘어 프로젝트 전체를 이해하고 관리하는 지능형 개발 파트너가 될 것입니다.