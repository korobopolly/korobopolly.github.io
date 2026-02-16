---
title: "WebSocket과 STOMP 프로토콜 - 실시간 양방향 통신"
date: 2026-02-16T13:23:00+09:00
draft: false
tags: ["네트워크", "WebSocket", "STOMP", "실시간"]
categories: ["네트워크"]
series: "네트워크"
description: "WebSocket과 STOMP 프로토콜을 활용한 실시간 양방향 통신 구현 방법을 알아봅니다"
---

## HTTP 폴링 vs WebSocket

실시간 통신을 구현하는 방법은 크게 두 가지입니다.

### HTTP 폴링 (Polling)

클라이언트가 주기적으로 서버에 요청을 보내 새 데이터를 확인합니다.

```javascript
// Short Polling
setInterval(() => {
    fetch('/api/messages')
        .then(res => res.json())
        .then(data => updateUI(data));
}, 1000); // 1초마다 요청
```

**단점:**
- 불필요한 요청이 많음 (데이터가 없어도 요청)
- 서버 부하 증가 (동시 접속자 1000명 = 초당 1000건 요청)
- 실시간성 낮음 (폴링 간격만큼 지연)

### Long Polling

서버가 새 데이터가 있을 때까지 응답을 보류합니다.

```javascript
function longPoll() {
    fetch('/api/messages/wait')
        .then(res => res.json())
        .then(data => {
            updateUI(data);
            longPoll(); // 다시 연결
        })
        .catch(() => {
            setTimeout(longPoll, 5000); // 오류 시 재시도
        });
}
```

**개선점:**
- 불필요한 요청 감소
- 더 나은 실시간성

**여전한 문제:**
- HTTP 헤더 오버헤드 (매 요청마다 수백 바이트)
- 연결 수립/종료 비용

### WebSocket

양방향 전이중(Full-Duplex) 통신을 제공하는 프로토콜입니다.

```javascript
const ws = new WebSocket('ws://localhost:8080/chat');

ws.onopen = () => {
    console.log('연결됨');
    ws.send(JSON.stringify({ type: 'join', room: 'general' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateUI(data);
};

ws.onerror = (error) => {
    console.error('오류:', error);
};

ws.onclose = () => {
    console.log('연결 종료');
    // 재연결 로직
};
```

**장점:**
- 낮은 지연 시간 (< 10ms)
- 작은 오버헤드 (프레임 헤더 2-14 바이트)
- 양방향 통신 (서버 → 클라이언트 푸시 가능)
- 하나의 TCP 연결로 지속적 통신

## WebSocket 프로토콜 이해

WebSocket은 HTTP 위에서 동작하지만 독립적인 프로토콜입니다.

### 핸드셰이크 (Handshake)

클라이언트가 HTTP 요청으로 WebSocket 연결을 시작합니다.

```http
GET /chat HTTP/1.1
Host: localhost:8080
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

서버가 응답하면 프로토콜이 WebSocket으로 전환됩니다.

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### WebSocket 프레임 구조

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

**주요 필드:**
- FIN: 최종 프레임 여부
- opcode: 프레임 타입 (0x1=텍스트, 0x2=바이너리, 0x8=종료)
- MASK: 페이로드 마스킹 여부 (클라이언트 → 서버는 필수)
- Payload len: 페이로드 길이

## Spring Boot WebSocket 설정

Spring Boot는 WebSocket을 쉽게 구현할 수 있는 추상화를 제공합니다.

### 의존성 추가

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### WebSocket 설정

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatHandler(), "/chat")
                .setAllowedOrigins("*"); // CORS 설정
    }

    @Bean
    public WebSocketHandler chatHandler() {
        return new ChatWebSocketHandler();
    }
}
```

### WebSocketHandler 구현

```java
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Set<WebSocketSession> sessions =
        Collections.synchronizedSet(new HashSet<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        System.out.println("새 연결: " + session.getId());

        // 환영 메시지 전송
        session.sendMessage(new TextMessage(
            "{\"type\":\"system\",\"message\":\"채팅방에 입장했습니다\"}"
        ));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message)
            throws Exception {
        String payload = message.getPayload();
        System.out.println("수신: " + payload);

        // 모든 클라이언트에게 브로드캐스트
        synchronized (sessions) {
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    s.sendMessage(message);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status)
            throws Exception {
        sessions.remove(session);
        System.out.println("연결 종료: " + session.getId() + ", 상태: " + status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception)
            throws Exception {
        System.err.println("전송 오류: " + exception.getMessage());
        session.close();
    }
}
```

## STOMP 프로토콜

STOMP (Simple Text Oriented Messaging Protocol)는 WebSocket 위에서 동작하는 메시징 프로토콜입니다.

### STOMP를 사용하는 이유

WebSocket만으로는 메시지 라우팅, 구독 관리가 어렵습니다. STOMP는 이를 표준화합니다.

**STOMP의 장점:**
- 메시지 라우팅 (`/topic`, `/queue`, `/user`)
- 구독 관리 (subscribe/unsubscribe)
- ACK/NACK 메커니즘
- 트랜잭션 지원

### STOMP 프레임 구조

```
COMMAND
header1:value1
header2:value2

Body^@
```

**예시: 구독 (SUBSCRIBE)**
```
SUBSCRIBE
id:sub-1
destination:/topic/chat

^@
```

**예시: 메시지 전송 (SEND)**
```
SEND
destination:/app/chat
content-type:application/json

{"message":"Hello World"}^@
```

**예시: 메시지 수신 (MESSAGE)**
```
MESSAGE
destination:/topic/chat
message-id:123
subscription:sub-1

{"message":"Hello World"}^@
```

## Spring Boot STOMP 설정

### @EnableWebSocketMessageBroker

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 클라이언트로 메시지를 전달하는 브로커 설정
        config.enableSimpleBroker("/topic", "/queue");

        // 클라이언트가 메시지를 보낼 목적지 prefix
        config.setApplicationDestinationPrefixes("/app");

        // 특정 사용자에게 메시지를 보낼 때 사용
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // STOMP 엔드포인트 등록
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // SockJS 폴백 지원
    }
}
```

### 메시지 컨트롤러

```java
@Controller
public class ChatController {

    @MessageMapping("/chat.send") // 클라이언트가 /app/chat.send로 전송
    @SendTo("/topic/chat") // 구독자 모두에게 전달
    public ChatMessage sendMessage(ChatMessage message) {
        message.setTimestamp(System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/chat.join")
    @SendTo("/topic/chat")
    public ChatMessage joinChat(@Payload ChatMessage message,
                                 SimpMessageHeaderAccessor headerAccessor) {
        // 세션에 사용자 이름 저장
        headerAccessor.getSessionAttributes().put("username", message.getSender());

        message.setType(ChatMessage.MessageType.JOIN);
        message.setContent(message.getSender() + "님이 입장했습니다");
        return message;
    }
}
```

### 메시지 모델

```java
public class ChatMessage {

    public enum MessageType {
        CHAT, JOIN, LEAVE
    }

    private MessageType type;
    private String content;
    private String sender;
    private long timestamp;

    // Getters, Setters
}
```

### 연결 이벤트 처리

```java
@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("새로운 WebSocket 연결");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            logger.info("사용자 퇴장: " + username);

            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(ChatMessage.MessageType.LEAVE);
            chatMessage.setSender(username);
            chatMessage.setContent(username + "님이 퇴장했습니다");

            messagingTemplate.convertAndSend("/topic/chat", chatMessage);
        }
    }
}
```

## SimpMessagingTemplate으로 서버에서 메시지 발행

서버 측에서 임의로 메시지를 전송할 수 있습니다.

### 전체 브로드캐스트

```java
@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyAllUsers(String message) {
        messagingTemplate.convertAndSend("/topic/notifications", message);
    }

    // 스케줄링 예시
    @Scheduled(fixedRate = 60000) // 1분마다
    public void sendHeartbeat() {
        Map<String, Object> heartbeat = Map.of(
            "type", "heartbeat",
            "timestamp", System.currentTimeMillis()
        );
        messagingTemplate.convertAndSend("/topic/heartbeat", heartbeat);
    }
}
```

### 특정 사용자에게 전송

```java
@Service
public class UserNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyUser(String username, String message) {
        messagingTemplate.convertAndSendToUser(
            username,
            "/queue/notifications",
            message
        );
    }

    // 사용 예시
    public void sendPrivateMessage(String from, String to, String content) {
        PrivateMessage msg = new PrivateMessage(from, content, System.currentTimeMillis());
        messagingTemplate.convertAndSendToUser(to, "/queue/private", msg);
    }
}
```

### 조건부 전송

```java
@Service
public class ConditionalBroadcast {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyActiveUsers(String message) {
        // 특정 조건을 만족하는 사용자만 필터링
        List<String> activeUsers = getActiveUsers();

        for (String user : activeUsers) {
            messagingTemplate.convertAndSendToUser(
                user,
                "/queue/updates",
                message
            );
        }
    }

    private List<String> getActiveUsers() {
        // 활성 사용자 목록 조회 로직
        return Arrays.asList("user1", "user2", "user3");
    }
}
```

## 클라이언트 구현: @stomp/stompjs + SockJS

### 설치

```bash
npm install @stomp/stompjs sockjs-client
```

### React 클라이언트 예시

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useState, useEffect, useRef } from 'react';

function ChatComponent() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('');
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);

    useEffect(() => {
        if (username) {
            connect();
        }

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [username]);

    const connect = () => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),

            onConnect: () => {
                console.log('연결됨');
                setConnected(true);

                // 채팅방 구독
                client.subscribe('/topic/chat', (message) => {
                    const chatMessage = JSON.parse(message.body);
                    setMessages(prev => [...prev, chatMessage]);
                });

                // 입장 메시지 전송
                client.publish({
                    destination: '/app/chat.join',
                    body: JSON.stringify({
                        sender: username,
                        type: 'JOIN'
                    })
                });
            },

            onStompError: (frame) => {
                console.error('STOMP 오류:', frame.headers['message']);
                console.error('상세:', frame.body);
            },

            onDisconnect: () => {
                console.log('연결 종료');
                setConnected(false);
            }
        });

        clientRef.current = client;
        client.activate();
    };

    const sendMessage = () => {
        if (input.trim() && clientRef.current) {
            clientRef.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify({
                    sender: username,
                    content: input,
                    type: 'CHAT'
                })
            });
            setInput('');
        }
    };

    return (
        <div>
            {!username ? (
                <div>
                    <input
                        placeholder="이름 입력"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') setUsername(e.target.value);
                        }}
                    />
                </div>
            ) : (
                <div>
                    <div className="messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.type}`}>
                                <strong>{msg.sender}:</strong> {msg.content}
                            </div>
                        ))}
                    </div>
                    <div className="input-area">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') sendMessage();
                            }}
                            disabled={!connected}
                        />
                        <button onClick={sendMessage} disabled={!connected}>
                            전송
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatComponent;
```

### Vanilla JavaScript 클라이언트

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketClient {
    constructor(url, username) {
        this.url = url;
        this.username = username;
        this.client = null;
        this.subscriptions = new Map();
    }

    connect() {
        this.client = new Client({
            webSocketFactory: () => new SockJS(this.url),

            reconnectDelay: 5000, // 재연결 대기 시간

            heartbeatIncoming: 20000, // 서버로부터 하트비트 기대 주기
            heartbeatOutgoing: 20000, // 클라이언트 하트비트 전송 주기

            onConnect: (frame) => {
                console.log('연결됨:', frame);
                this.onConnected();
            },

            onStompError: (frame) => {
                console.error('STOMP 오류:', frame);
            },

            onWebSocketClose: (event) => {
                console.log('WebSocket 종료:', event);
            }
        });

        this.client.activate();
    }

    onConnected() {
        // 채팅 메시지 구독
        this.subscribe('/topic/chat', (message) => {
            this.handleChatMessage(JSON.parse(message.body));
        });

        // 개인 알림 구독
        this.subscribe(`/user/queue/notifications`, (message) => {
            this.handleNotification(JSON.parse(message.body));
        });
    }

    subscribe(destination, callback) {
        const subscription = this.client.subscribe(destination, callback);
        this.subscriptions.set(destination, subscription);
        return subscription;
    }

    unsubscribe(destination) {
        const subscription = this.subscriptions.get(destination);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }

    send(destination, body) {
        this.client.publish({
            destination,
            body: JSON.stringify(body)
        });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }

    handleChatMessage(message) {
        console.log('채팅 메시지:', message);
        // UI 업데이트 로직
    }

    handleNotification(notification) {
        console.log('알림:', notification);
        // 알림 표시 로직
    }
}

// 사용 예시
const client = new WebSocketClient('http://localhost:8080/ws', 'user123');
client.connect();

// 메시지 전송
setTimeout(() => {
    client.send('/app/chat.send', {
        sender: 'user123',
        content: 'Hello!',
        type: 'CHAT'
    });
}, 2000);
```

## SockJS 폴백 메커니즘

SockJS는 WebSocket을 지원하지 않는 환경에서 자동으로 폴백을 제공합니다.

### 폴백 순서

1. **WebSocket** (최우선)
2. **HTTP Streaming** (xhr-streaming, iframe-eventsource)
3. **HTTP Long-Polling** (xhr-polling, jsonp-polling)

### Spring Boot 설정

```java
@Override
public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS()
            .setStreamBytesLimit(512 * 1024) // 스트리밍 제한
            .setHttpMessageCacheSize(1000)   // 메시지 캐시 크기
            .setDisconnectDelay(30 * 1000);  // 연결 종료 대기 시간
}
```

### 클라이언트 옵션 설정

```javascript
const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws', null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 5000
    }),

    debug: (str) => {
        console.log('SockJS Debug:', str);
    }
});
```

### 전송 방식 감지

```javascript
const sockjs = new SockJS('http://localhost:8080/ws');

sockjs.onopen = function() {
    console.log('사용된 전송 방식:', sockjs.protocol);
    // 출력 예: "websocket", "xhr-streaming", "xhr-polling"
};
```

## 하트비트 최적화

하트비트는 연결 상태를 확인하지만 과도하면 네트워크 트래픽을 증가시킵니다.

### 기본 설정 문제

```javascript
// 기본 설정 (4초 간격)
heartbeatIncoming: 4000,
heartbeatOutgoing: 4000
```

**트래픽 계산:**
- 하트비트 프레임 크기: 약 2 바이트
- 초당 전송량: 2 bytes / 4s = 0.5 bytes/s
- 사용자 1000명 × 0.5 = 500 bytes/s
- 하루: 500 × 86400 = 43.2 MB/day

### 최적화된 설정

```javascript
// 최적화 (20초 간격)
heartbeatIncoming: 20000,
heartbeatOutgoing: 20000
```

**개선 효과:**
- 트래픽 80% 절감
- 서버 CPU 사용량 감소
- 연결 안정성 유지

### 서버 측 설정

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue")
              .setHeartbeatValue(new long[]{20000, 20000}); // [서버→클라이언트, 클라이언트→서버]

        config.setApplicationDestinationPrefixes("/app");
    }
}
```

### 동적 하트비트 조정

```javascript
class AdaptiveHeartbeat {
    constructor(client) {
        this.client = client;
        this.currentInterval = 20000;
        this.minInterval = 5000;
        this.maxInterval = 60000;
    }

    onConnectionStable() {
        // 연결이 안정적이면 간격 증가
        this.currentInterval = Math.min(
            this.currentInterval * 1.5,
            this.maxInterval
        );
        this.updateHeartbeat();
    }

    onConnectionUnstable() {
        // 연결이 불안정하면 간격 감소
        this.currentInterval = Math.max(
            this.currentInterval / 2,
            this.minInterval
        );
        this.updateHeartbeat();
    }

    updateHeartbeat() {
        this.client.heartbeatIncoming = this.currentInterval;
        this.client.heartbeatOutgoing = this.currentInterval;
        console.log('하트비트 간격 조정:', this.currentInterval);
    }
}
```

## 재연결 전략

네트워크 오류 시 효과적으로 재연결하는 전략이 필요합니다.

### Fast Retry + Slow Reconnect

```javascript
class ReconnectStrategy {
    constructor() {
        this.fastRetryCount = 0;
        this.maxFastRetries = 3;
        this.fastRetryDelay = 5000; // 5초
        this.slowRetryDelay = 60000; // 60초
    }

    getDelay() {
        if (this.fastRetryCount < this.maxFastRetries) {
            return this.fastRetryDelay;
        }
        return this.slowRetryDelay;
    }

    onReconnectAttempt() {
        this.fastRetryCount++;
    }

    onConnected() {
        this.fastRetryCount = 0; // 성공 시 리셋
    }
}

const reconnectStrategy = new ReconnectStrategy();

const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),

    reconnectDelay: 0, // 직접 관리

    onConnect: () => {
        console.log('연결 성공');
        reconnectStrategy.onConnected();
    },

    onWebSocketClose: () => {
        console.log('연결 종료, 재연결 대기 중...');

        reconnectStrategy.onReconnectAttempt();
        const delay = reconnectStrategy.getDelay();

        console.log(`${delay / 1000}초 후 재연결 시도 (${reconnectStrategy.fastRetryCount}/${reconnectStrategy.maxFastRetries})`);

        setTimeout(() => {
            client.activate();
        }, delay);
    }
});
```

### 지수 백오프

```javascript
class ExponentialBackoff {
    constructor(initialDelay = 1000, maxDelay = 60000, multiplier = 2) {
        this.initialDelay = initialDelay;
        this.maxDelay = maxDelay;
        this.multiplier = multiplier;
        this.currentDelay = initialDelay;
    }

    getDelay() {
        const delay = this.currentDelay;
        this.currentDelay = Math.min(
            this.currentDelay * this.multiplier,
            this.maxDelay
        );
        return delay;
    }

    reset() {
        this.currentDelay = this.initialDelay;
    }
}

const backoff = new ExponentialBackoff(1000, 60000, 2);

client.onWebSocketClose = () => {
    const delay = backoff.getDelay();
    console.log(`${delay}ms 후 재연결 (지수 백오프)`);

    setTimeout(() => {
        client.activate();
    }, delay);
};

client.onConnect = () => {
    backoff.reset(); // 성공 시 리셋
};
```

### 연결 상태 관리

```javascript
class ConnectionManager {
    constructor(client) {
        this.client = client;
        this.state = 'disconnected'; // disconnected, connecting, connected
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    connect() {
        if (this.state === 'connected' || this.state === 'connecting') {
            console.log('이미 연결 중 또는 연결됨');
            return;
        }

        this.state = 'connecting';
        this.client.activate();
    }

    onConnected() {
        this.state = 'connected';
        this.reconnectAttempts = 0;
        this.notifyStateChange('connected');
    }

    onDisconnected() {
        this.state = 'disconnected';
        this.notifyStateChange('disconnected');

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
        } else {
            console.error('최대 재연결 시도 횟수 초과');
            this.notifyStateChange('failed');
        }
    }

    reconnect() {
        this.reconnectAttempts++;
        console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 60000);
        setTimeout(() => this.connect(), delay);
    }

    notifyStateChange(state) {
        // UI 업데이트 또는 콜백 호출
        console.log('연결 상태:', state);
        document.dispatchEvent(new CustomEvent('connectionState', { detail: state }));
    }
}

const manager = new ConnectionManager(client);

client.onConnect = () => manager.onConnected();
client.onWebSocketClose = () => manager.onDisconnected();

manager.connect();
```

## 토픽 구독과 메시지 라우팅

STOMP는 목적지 기반 라우팅을 제공합니다.

### 토픽 vs 큐

**토픽 (/topic):** 브로드캐스트 (구독자 모두에게 전달)
```java
@SendTo("/topic/notifications")
public Notification sendNotification(Notification notification) {
    return notification;
}
```

**큐 (/queue):** Point-to-Point (한 구독자에게만 전달)
```java
@MessageMapping("/task.assign")
@SendToUser("/queue/tasks")
public Task assignTask(Task task) {
    return task;
}
```

### 다중 구독

```javascript
// 여러 토픽 구독
const subscriptions = [
    client.subscribe('/topic/agent-status', handleAgentStatus),
    client.subscribe('/topic/progress', handleProgress),
    client.subscribe('/user/queue/alerts', handleAlert)
];

function handleAgentStatus(message) {
    const status = JSON.parse(message.body);
    console.log('에이전트 상태:', status);
    updateAgentStatusUI(status);
}

function handleProgress(message) {
    const progress = JSON.parse(message.body);
    console.log('진행률:', progress.percentage + '%');
    updateProgressBar(progress.percentage);
}

function handleAlert(message) {
    const alert = JSON.parse(message.body);
    showNotification(alert.title, alert.message);
}

// 구독 해제
function cleanup() {
    subscriptions.forEach(sub => sub.unsubscribe());
}
```

### 동적 라우팅

```java
@Controller
public class DynamicRoutingController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/data.update")
    public void handleDataUpdate(@Payload DataUpdate update,
                                  @Header("target") String target) {
        // 헤더 기반 라우팅
        String destination = "/topic/" + target;
        messagingTemplate.convertAndSend(destination, update);
    }

    // 조건부 라우팅
    @MessageMapping("/message.send")
    public void sendMessage(@Payload Message message) {
        if (message.isPriority()) {
            messagingTemplate.convertAndSend("/topic/priority", message);
        } else {
            messagingTemplate.convertAndSend("/topic/general", message);
        }
    }
}
```

## 실전 예시: 파일 전송 진행률 실시간 모니터링

파일 업로드 진행률을 WebSocket으로 실시간 모니터링하는 대시보드를 만들어보겠습니다.

### 백엔드: 파일 업로드 서비스

```java
@Service
public class FileUploadService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void uploadFile(String uploadId, MultipartFile file, String userId) {
        long totalSize = file.getSize();
        long uploadedSize = 0;

        try (InputStream is = file.getInputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = is.read(buffer)) != -1) {
                // 파일 처리 로직 (저장 등)
                processChunk(buffer, bytesRead);

                uploadedSize += bytesRead;
                int percentage = (int) ((uploadedSize * 100) / totalSize);

                // 진행률 전송
                sendProgress(userId, uploadId, percentage, uploadedSize, totalSize);

                // 시뮬레이션을 위한 지연 (실제로는 불필요)
                Thread.sleep(50);
            }

            // 완료 알림
            sendCompletion(userId, uploadId, file.getOriginalFilename());

        } catch (IOException | InterruptedException e) {
            sendError(userId, uploadId, e.getMessage());
        }
    }

    private void sendProgress(String userId, String uploadId,
                               int percentage, long uploaded, long total) {
        Map<String, Object> progress = Map.of(
            "uploadId", uploadId,
            "percentage", percentage,
            "uploadedBytes", uploaded,
            "totalBytes", total,
            "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/upload-progress",
            progress
        );
    }

    private void sendCompletion(String userId, String uploadId, String filename) {
        Map<String, Object> completion = Map.of(
            "uploadId", uploadId,
            "filename", filename,
            "status", "completed",
            "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/upload-complete",
            completion
        );
    }

    private void sendError(String userId, String uploadId, String error) {
        Map<String, Object> errorMsg = Map.of(
            "uploadId", uploadId,
            "error", error,
            "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/upload-error",
            errorMsg
        );
    }

    private void processChunk(byte[] buffer, int length) {
        // 실제 파일 저장 로직
    }
}
```

### 백엔드: 업로드 컨트롤러

```java
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Autowired
    private FileUploadService uploadService;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        String uploadId = UUID.randomUUID().toString();

        // 비동기 처리
        CompletableFuture.runAsync(() -> {
            uploadService.uploadFile(uploadId, file, user.getUsername());
        });

        return ResponseEntity.ok(Map.of(
            "uploadId", uploadId,
            "message", "Upload started"
        ));
    }
}
```

### 프론트엔드: React 대시보드

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useState, useEffect } from 'react';

function FileUploadDashboard() {
    const [uploads, setUploads] = useState({});
    const [client, setClient] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),

            onConnect: () => {
                console.log('WebSocket 연결됨');

                // 진행률 구독
                stompClient.subscribe('/user/queue/upload-progress', (message) => {
                    const progress = JSON.parse(message.body);
                    updateProgress(progress);
                });

                // 완료 알림 구독
                stompClient.subscribe('/user/queue/upload-complete', (message) => {
                    const completion = JSON.parse(message.body);
                    handleCompletion(completion);
                });

                // 오류 알림 구독
                stompClient.subscribe('/user/queue/upload-error', (message) => {
                    const error = JSON.parse(message.body);
                    handleError(error);
                });
            }
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            stompClient.deactivate();
        };
    }, []);

    const updateProgress = (progress) => {
        setUploads(prev => ({
            ...prev,
            [progress.uploadId]: {
                ...prev[progress.uploadId],
                percentage: progress.percentage,
                uploadedBytes: progress.uploadedBytes,
                totalBytes: progress.totalBytes,
                status: 'uploading'
            }
        }));
    };

    const handleCompletion = (completion) => {
        setUploads(prev => ({
            ...prev,
            [completion.uploadId]: {
                ...prev[completion.uploadId],
                filename: completion.filename,
                status: 'completed',
                percentage: 100
            }
        }));
    };

    const handleError = (error) => {
        setUploads(prev => ({
            ...prev,
            [error.uploadId]: {
                ...prev[error.uploadId],
                status: 'error',
                error: error.error
            }
        }));
    };

    const uploadFile = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('http://localhost:8080/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            setUploads(prev => ({
                ...prev,
                [data.uploadId]: {
                    filename: selectedFile.name,
                    totalBytes: selectedFile.size,
                    uploadedBytes: 0,
                    percentage: 0,
                    status: 'started'
                }
            }));

        } catch (error) {
            console.error('업로드 시작 실패:', error);
        }
    };

    return (
        <div className="upload-dashboard">
            <h2>파일 업로드 대시보드</h2>

            <div className="upload-controls">
                <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <button onClick={uploadFile}>업로드</button>
            </div>

            <div className="upload-list">
                {Object.entries(uploads).map(([uploadId, upload]) => (
                    <div key={uploadId} className="upload-item">
                        <div className="filename">{upload.filename}</div>

                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${upload.percentage}%` }}
                            />
                        </div>

                        <div className="upload-stats">
                            <span>{upload.percentage}%</span>
                            <span>
                                {formatBytes(upload.uploadedBytes)} / {formatBytes(upload.totalBytes)}
                            </span>
                            <span className={`status ${upload.status}`}>
                                {upload.status}
                            </span>
                        </div>

                        {upload.error && (
                            <div className="error">{upload.error}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default FileUploadDashboard;
```

### CSS 스타일

```css
.upload-dashboard {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.upload-controls {
    margin-bottom: 20px;
}

.upload-item {
    border: 1px solid #ddd;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 5px;
}

.filename {
    font-weight: bold;
    margin-bottom: 10px;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #45a049);
    transition: width 0.3s ease;
}

.upload-stats {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;
}

.status {
    padding: 2px 8px;
    border-radius: 3px;
}

.status.uploading {
    background: #2196F3;
    color: white;
}

.status.completed {
    background: #4CAF50;
    color: white;
}

.status.error {
    background: #f44336;
    color: white;
}

.error {
    color: #f44336;
    margin-top: 10px;
    font-size: 14px;
}
```

## 마무리

WebSocket과 STOMP 프로토콜을 활용하면 효율적인 실시간 양방향 통신을 구현할 수 있습니다.

**핵심 내용 정리:**
- WebSocket은 HTTP 폴링보다 낮은 지연과 오버헤드
- STOMP는 메시지 라우팅과 구독 관리 표준화
- Spring Boot는 `@EnableWebSocketMessageBroker`로 간편한 설정
- SockJS는 WebSocket 미지원 환경에서 자동 폴백
- 하트비트 최적화로 트래픽 절감
- 재연결 전략으로 안정적인 연결 유지
- 토픽/큐 기반 메시지 라우팅

**다음 단계:**
- Redis 백엔드로 클러스터 환경 지원
- Spring Security로 WebSocket 인증/인가
- 메시지 압축으로 대역폭 절감
- RabbitMQ/Kafka와 통합

실시간 통신은 현대 웹 애플리케이션의 필수 요소입니다. WebSocket과 STOMP로 사용자 경험을 한 단계 끌어올려보세요.
