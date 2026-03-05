---
title: "소켓 프로그래밍 - Java TCP 통신, 프로토콜 설계, 스레드 분리"
date: 2026-02-16T13:22:00+09:00
draft: false
tags: ["네트워크", "소켓", "TCP", "프로토콜", "Java", "Spring Boot"]
categories: ["네트워크"]
series: "네트워크"
description: "Java 소켓 프로그래밍으로 TCP 클라이언트-서버 통신과 커스텀 프로토콜 설계를 배웁니다"
---

## 네트워크 기초

네트워크 프로그래밍에서 가장 중요한 선택 중 하나는 전송 프로토콜입니다. TCP와 UDP의 차이를 이해하는 것이 첫 번째 단계입니다.

### TCP vs UDP

**TCP (Transmission Control Protocol)**
- 연결 지향 프로토콜: 3-way handshake로 연결 수립
- 신뢰성 보장: 패킷 순서 보장, 재전송 메커니즘
- 흐름 제어와 혼잡 제어
- 용도: HTTP, 파일 전송, 데이터베이스 연결

**UDP (User Datagram Protocol)**
- 비연결 프로토콜: 연결 수립 없이 즉시 전송
- 신뢰성 미보장: 패킷 손실 가능, 순서 보장 없음
- 낮은 오버헤드, 빠른 전송 속도
- 용도: DNS, 스트리밍, 온라인 게임

이 포스트에서는 신뢰성 있는 통신이 필요한 대부분의 애플리케이션에 적합한 TCP를 중심으로 설명합니다.

## Java 소켓 기본

Java는 `java.net` 패키지를 통해 소켓 프로그래밍을 지원합니다.

### ServerSocket과 Socket

```java
// 서버 측: 포트에서 연결 대기
ServerSocket serverSocket = new ServerSocket(8080);
Socket clientSocket = serverSocket.accept(); // 블로킹

// 클라이언트 측: 서버에 연결
Socket socket = new Socket("localhost", 8080);
```

`accept()` 메서드는 클라이언트 연결이 들어올 때까지 블로킹됩니다. 연결이 수립되면 양방향 통신이 가능한 `Socket` 객체를 반환합니다.

## TCP 클라이언트-서버 구현

기본적인 에코 서버와 클라이언트를 구현해보겠습니다.

### 에코 서버

```java
public class EchoServer {
    private static final int PORT = 8080;

    public static void main(String[] args) {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("서버가 포트 " + PORT + "에서 시작되었습니다.");

            while (true) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("클라이언트 연결: " + clientSocket.getRemoteSocketAddress());

                // 각 클라이언트를 별도 스레드에서 처리
                new Thread(() -> handleClient(clientSocket)).start();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static void handleClient(Socket socket) {
        try (
            BufferedReader in = new BufferedReader(
                new InputStreamReader(socket.getInputStream())
            );
            PrintWriter out = new PrintWriter(
                socket.getOutputStream(), true
            )
        ) {
            String line;
            while ((line = in.readLine()) != null) {
                System.out.println("수신: " + line);
                out.println("Echo: " + line);
            }
        } catch (IOException e) {
            System.err.println("클라이언트 처리 오류: " + e.getMessage());
        } finally {
            try {
                socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

### 에코 클라이언트

```java
public class EchoClient {
    private static final String HOST = "localhost";
    private static final int PORT = 8080;

    public static void main(String[] args) {
        try (
            Socket socket = new Socket(HOST, PORT);
            BufferedReader in = new BufferedReader(
                new InputStreamReader(socket.getInputStream())
            );
            PrintWriter out = new PrintWriter(
                socket.getOutputStream(), true
            );
            BufferedReader userInput = new BufferedReader(
                new InputStreamReader(System.in)
            )
        ) {
            System.out.println("서버에 연결되었습니다.");

            String line;
            while ((line = userInput.readLine()) != null) {
                out.println(line);
                String response = in.readLine();
                System.out.println("응답: " + response);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## InputStream과 OutputStream으로 데이터 교환

소켓 통신의 핵심은 스트림을 통한 데이터 교환입니다.

### 바이너리 데이터 전송

```java
// 서버: 바이너리 데이터 수신
DataInputStream dis = new DataInputStream(socket.getInputStream());
int length = dis.readInt();
byte[] data = new byte[length];
dis.readFully(data);

// 클라이언트: 바이너리 데이터 전송
byte[] data = "Hello".getBytes(StandardCharsets.UTF_8);
DataOutputStream dos = new DataOutputStream(socket.getOutputStream());
dos.writeInt(data.length);
dos.write(data);
dos.flush();
```

### 텍스트 데이터 전송

```java
// BufferedReader/PrintWriter 사용 (줄 단위 처리)
BufferedReader reader = new BufferedReader(
    new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8)
);
PrintWriter writer = new PrintWriter(
    new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8),
    true // autoFlush
);

writer.println("Hello Server");
String response = reader.readLine();
```

## JSON 기반 메시지 프로토콜 설계

실전에서는 구조화된 데이터를 주고받아야 합니다. JSON을 사용한 프로토콜을 설계해보겠습니다.

### Length-Prefixed Binary Framing

메시지 경계를 명확히 하기 위해 길이 접두사를 사용합니다.

```text
[4 bytes: message length][N bytes: JSON message]
```

```java
public class MessageProtocol {

    // 메시지 전송
    public static void sendMessage(OutputStream out, String jsonMessage)
            throws IOException {
        byte[] data = jsonMessage.getBytes(StandardCharsets.UTF_8);
        DataOutputStream dos = new DataOutputStream(out);

        // 1. 길이 전송 (4 bytes)
        dos.writeInt(data.length);
        // 2. 데이터 전송
        dos.write(data);
        dos.flush();
    }

    // 메시지 수신
    public static String receiveMessage(InputStream in)
            throws IOException {
        DataInputStream dis = new DataInputStream(in);

        // 1. 길이 읽기
        int length = dis.readInt();

        // 2. 데이터 읽기
        byte[] data = new byte[length];
        dis.readFully(data);

        return new String(data, StandardCharsets.UTF_8);
    }
}
```

### JSON 메시지 구조

```java
public class Message {
    private String type;      // "command", "response", "heartbeat"
    private String action;    // "execute", "status", "ping"
    private Map<String, Object> payload;
    private long timestamp;

    // Getters, Setters, Constructors
}

// Jackson 라이브러리 사용
ObjectMapper mapper = new ObjectMapper();

// 직렬화
Message msg = new Message("command", "execute",
    Map.of("cmd", "ls -la"), System.currentTimeMillis());
String json = mapper.writeValueAsString(msg);

// 역직렬화
Message received = mapper.readValue(json, Message.class);
```

## 멀티 클라이언트 처리

서버가 여러 클라이언트를 동시에 처리하려면 스레드풀을 활용합니다.

### ExecutorService를 사용한 스레드풀

```java
public class ThreadPoolServer {
    private static final int PORT = 8080;
    private static final int THREAD_POOL_SIZE = 10;

    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);

        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("서버 시작 (스레드풀 크기: " + THREAD_POOL_SIZE + ")");

            while (true) {
                Socket clientSocket = serverSocket.accept();
                executor.submit(new ClientHandler(clientSocket));
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            executor.shutdown();
        }
    }

    static class ClientHandler implements Runnable {
        private final Socket socket;

        public ClientHandler(Socket socket) {
            this.socket = socket;
        }

        @Override
        public void run() {
            try (socket) {
                handleClient(socket);
            } catch (IOException e) {
                System.err.println("클라이언트 처리 오류: " + e.getMessage());
            }
        }

        private void handleClient(Socket socket) throws IOException {
            ObjectMapper mapper = new ObjectMapper();

            while (!socket.isClosed()) {
                String json = MessageProtocol.receiveMessage(socket.getInputStream());
                Message msg = mapper.readValue(json, Message.class);

                // 메시지 처리
                Message response = processMessage(msg);

                String responseJson = mapper.writeValueAsString(response);
                MessageProtocol.sendMessage(socket.getOutputStream(), responseJson);
            }
        }

        private Message processMessage(Message msg) {
            // 비즈니스 로직
            return new Message("response", "ack",
                Map.of("status", "ok"), System.currentTimeMillis());
        }
    }
}
```

### 동시성 제어

```java
// 클라이언트 목록 관리
private static final Set<Socket> clients =
    Collections.synchronizedSet(new HashSet<>());

// 연결 시
clients.add(clientSocket);

// 연결 종료 시
clients.remove(clientSocket);

// 브로드캐스트
public static void broadcast(String message) {
    synchronized (clients) {
        for (Socket client : clients) {
            try {
                MessageProtocol.sendMessage(client.getOutputStream(), message);
            } catch (IOException e) {
                clients.remove(client);
            }
        }
    }
}
```

## 하트비트 메커니즘

연결이 살아있는지 확인하기 위해 주기적으로 하트비트를 전송합니다.

### 서버 측 하트비트 구현

```java
public class HeartbeatServer {
    private static final long HEARTBEAT_INTERVAL = 60_000; // 60초
    private static final long HEARTBEAT_TIMEOUT = 180_000; // 3분

    static class ClientSession {
        private final Socket socket;
        private volatile long lastHeartbeat;
        private final ScheduledExecutorService scheduler;

        public ClientSession(Socket socket) {
            this.socket = socket;
            this.lastHeartbeat = System.currentTimeMillis();
            this.scheduler = Executors.newSingleThreadScheduledExecutor();

            // 하트비트 전송 작업
            scheduler.scheduleAtFixedRate(
                this::sendHeartbeat,
                HEARTBEAT_INTERVAL,
                HEARTBEAT_INTERVAL,
                TimeUnit.MILLISECONDS
            );

            // 타임아웃 체크 작업
            scheduler.scheduleAtFixedRate(
                this::checkTimeout,
                HEARTBEAT_TIMEOUT,
                HEARTBEAT_TIMEOUT,
                TimeUnit.MILLISECONDS
            );
        }

        private void sendHeartbeat() {
            try {
                Message heartbeat = new Message(
                    "heartbeat", "ping",
                    Map.of(), System.currentTimeMillis()
                );
                String json = new ObjectMapper().writeValueAsString(heartbeat);
                MessageProtocol.sendMessage(socket.getOutputStream(), json);
            } catch (IOException e) {
                System.err.println("하트비트 전송 실패: " + e.getMessage());
                close();
            }
        }

        public void onHeartbeatReceived() {
            this.lastHeartbeat = System.currentTimeMillis();
        }

        private void checkTimeout() {
            long elapsed = System.currentTimeMillis() - lastHeartbeat;
            if (elapsed > HEARTBEAT_TIMEOUT) {
                System.out.println("하트비트 타임아웃: " + elapsed + "ms");
                close();
            }
        }

        public void close() {
            scheduler.shutdown();
            try {
                socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

### 클라이언트 측 하트비트 응답

```java
public class HeartbeatClient {
    private void handleMessage(Message msg) {
        if ("heartbeat".equals(msg.getType()) && "ping".equals(msg.getAction())) {
            // 하트비트에 응답
            Message pong = new Message(
                "heartbeat", "pong",
                Map.of(), System.currentTimeMillis()
            );
            sendMessage(pong);
        }
    }
}
```

## 재연결 전략

네트워크 오류 시 자동으로 재연결하는 전략을 구현합니다.

### 지수 백오프 (Exponential Backoff)

```java
public class ReconnectClient {
    private static final String HOST = "localhost";
    private static final int PORT = 8080;

    private static final int[] BACKOFF_INTERVALS = {5, 10, 60}; // 초
    private int reconnectAttempt = 0;

    private Socket socket;
    private volatile boolean running = true;

    public void start() {
        while (running) {
            try {
                connect();
                reconnectAttempt = 0; // 연결 성공 시 리셋
                handleConnection();
            } catch (IOException e) {
                System.err.println("연결 오류: " + e.getMessage());
                reconnect();
            }
        }
    }

    private void connect() throws IOException {
        System.out.println("서버에 연결 중...");
        socket = new Socket(HOST, PORT);
        System.out.println("연결 성공: " + socket.getRemoteSocketAddress());
    }

    private void reconnect() {
        int delay = getBackoffDelay();
        System.out.println(delay + "초 후 재연결 시도...");

        try {
            Thread.sleep(delay * 1000L);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        reconnectAttempt++;
    }

    private int getBackoffDelay() {
        int index = Math.min(reconnectAttempt, BACKOFF_INTERVALS.length - 1);
        return BACKOFF_INTERVALS[index];
    }

    private void handleConnection() throws IOException {
        try (
            BufferedReader in = new BufferedReader(
                new InputStreamReader(socket.getInputStream())
            );
            PrintWriter out = new PrintWriter(
                socket.getOutputStream(), true
            )
        ) {
            String line;
            while ((line = in.readLine()) != null) {
                processMessage(line);
            }
        }
    }

    private void processMessage(String message) {
        System.out.println("수신: " + message);
    }

    public void stop() {
        running = false;
        try {
            if (socket != null) {
                socket.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## BufferedReader와 BufferedWriter 성능 최적화

버퍼링을 통해 I/O 성능을 크게 향상시킬 수 있습니다.

### 버퍼 크기 조정

```java
// 기본 버퍼 크기: 8192 bytes
BufferedReader reader = new BufferedReader(
    new InputStreamReader(socket.getInputStream())
);

// 커스텀 버퍼 크기: 16KB (대용량 데이터에 유리)
BufferedReader readerLarge = new BufferedReader(
    new InputStreamReader(socket.getInputStream()),
    16 * 1024
);

// 버퍼 크기가 클수록 시스템 콜 횟수 감소
BufferedWriter writer = new BufferedWriter(
    new OutputStreamWriter(socket.getOutputStream()),
    16 * 1024
);
```

### 명시적 플러시

```java
PrintWriter out = new PrintWriter(
    socket.getOutputStream(),
    true  // autoFlush = true (println 시 자동 플러시)
);

// autoFlush가 false일 때는 명시적으로 flush 필요
PrintWriter outManual = new PrintWriter(socket.getOutputStream());
outManual.println("Message 1");
outManual.println("Message 2");
outManual.flush(); // 버퍼에 쌓인 데이터를 한 번에 전송
```

### 성능 측정

```java
public class PerformanceTest {
    public static void main(String[] args) throws IOException {
        Socket socket = new Socket("localhost", 8080);

        // 버퍼 없이 전송
        long start1 = System.currentTimeMillis();
        OutputStream rawOut = socket.getOutputStream();
        for (int i = 0; i < 10000; i++) {
            rawOut.write(("Message " + i + "\n").getBytes());
        }
        long time1 = System.currentTimeMillis() - start1;
        System.out.println("버퍼 없이: " + time1 + "ms");

        // 버퍼 사용
        long start2 = System.currentTimeMillis();
        BufferedWriter buffered = new BufferedWriter(
            new OutputStreamWriter(socket.getOutputStream())
        );
        for (int i = 0; i < 10000; i++) {
            buffered.write("Message " + i + "\n");
        }
        buffered.flush();
        long time2 = System.currentTimeMillis() - start2;
        System.out.println("버퍼 사용: " + time2 + "ms");

        socket.close();
    }
}
```

## 실전 예시: 에이전트-콘솔 간 TCP 소켓 통신

실제 프로젝트에서 사용할 수 있는 에이전트 시스템을 구현해보겠습니다.

### 메시지 프로토콜 정의

```java
public class AgentMessage {
    public enum Type {
        REGISTER,       // 에이전트 등록
        COMMAND,        // 명령 실행
        RESPONSE,       // 명령 응답
        STATUS_UPDATE,  // 상태 업데이트
        HEARTBEAT       // 하트비트
    }

    private Type type;
    private String agentId;
    private String action;
    private Map<String, Object> data;
    private long timestamp;

    // Constructors, Getters, Setters

    public static AgentMessage command(String agentId, String action, Map<String, Object> data) {
        AgentMessage msg = new AgentMessage();
        msg.setType(Type.COMMAND);
        msg.setAgentId(agentId);
        msg.setAction(action);
        msg.setData(data);
        msg.setTimestamp(System.currentTimeMillis());
        return msg;
    }

    public static AgentMessage response(String agentId, Map<String, Object> data) {
        AgentMessage msg = new AgentMessage();
        msg.setType(Type.RESPONSE);
        msg.setAgentId(agentId);
        msg.setData(data);
        msg.setTimestamp(System.currentTimeMillis());
        return msg;
    }
}
```

### 콘솔 서버 구현

```java
public class ConsoleServer {
    private static final int PORT = 9999;
    private final Map<String, AgentConnection> agents = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public void start() throws IOException {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("콘솔 서버 시작: 포트 " + PORT);

            while (true) {
                Socket socket = serverSocket.accept();
                executor.submit(() -> handleAgent(socket));
            }
        }
    }

    private void handleAgent(Socket socket) {
        try {
            AgentConnection conn = new AgentConnection(socket);

            // 등록 메시지 대기
            String json = MessageProtocol.receiveMessage(socket.getInputStream());
            AgentMessage registerMsg = mapper.readValue(json, AgentMessage.class);

            if (registerMsg.getType() == AgentMessage.Type.REGISTER) {
                String agentId = registerMsg.getAgentId();
                agents.put(agentId, conn);
                System.out.println("에이전트 등록: " + agentId);

                // ACK 전송
                AgentMessage ack = AgentMessage.response(agentId,
                    Map.of("status", "registered"));
                sendMessage(socket, ack);

                // 메시지 처리 루프
                processMessages(socket, agentId);
            }
        } catch (IOException e) {
            System.err.println("에이전트 처리 오류: " + e.getMessage());
        }
    }

    private void processMessages(Socket socket, String agentId) throws IOException {
        while (!socket.isClosed()) {
            String json = MessageProtocol.receiveMessage(socket.getInputStream());
            AgentMessage msg = mapper.readValue(json, AgentMessage.class);

            switch (msg.getType()) {
                case STATUS_UPDATE:
                    handleStatusUpdate(agentId, msg);
                    break;
                case RESPONSE:
                    handleResponse(agentId, msg);
                    break;
                case HEARTBEAT:
                    agents.get(agentId).updateHeartbeat();
                    break;
                default:
                    System.out.println("알 수 없는 메시지: " + msg.getType());
            }
        }

        agents.remove(agentId);
        System.out.println("에이전트 연결 종료: " + agentId);
    }

    private void sendMessage(Socket socket, AgentMessage msg) throws IOException {
        String json = mapper.writeValueAsString(msg);
        MessageProtocol.sendMessage(socket.getOutputStream(), json);
    }

    public void sendCommand(String agentId, String action, Map<String, Object> data) {
        AgentConnection conn = agents.get(agentId);
        if (conn != null) {
            try {
                AgentMessage cmd = AgentMessage.command(agentId, action, data);
                sendMessage(conn.socket, cmd);
            } catch (IOException e) {
                System.err.println("명령 전송 실패: " + e.getMessage());
            }
        }
    }

    private void handleStatusUpdate(String agentId, AgentMessage msg) {
        System.out.println("상태 업데이트 [" + agentId + "]: " + msg.getData());
    }

    private void handleResponse(String agentId, AgentMessage msg) {
        System.out.println("응답 [" + agentId + "]: " + msg.getData());
    }

    static class AgentConnection {
        final Socket socket;
        volatile long lastHeartbeat;

        AgentConnection(Socket socket) {
            this.socket = socket;
            this.lastHeartbeat = System.currentTimeMillis();
        }

        void updateHeartbeat() {
            this.lastHeartbeat = System.currentTimeMillis();
        }
    }
}
```

### 에이전트 클라이언트 구현

```java
public class Agent {
    private final String agentId;
    private final String host;
    private final int port;
    private Socket socket;
    private final ObjectMapper mapper = new ObjectMapper();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    public Agent(String agentId, String host, int port) {
        this.agentId = agentId;
        this.host = host;
        this.port = port;
    }

    public void start() throws IOException {
        connect();
        register();
        startHeartbeat();
        listenForCommands();
    }

    private void connect() throws IOException {
        socket = new Socket(host, port);
        System.out.println("서버에 연결됨: " + socket.getRemoteSocketAddress());
    }

    private void register() throws IOException {
        AgentMessage registerMsg = new AgentMessage();
        registerMsg.setType(AgentMessage.Type.REGISTER);
        registerMsg.setAgentId(agentId);
        registerMsg.setData(Map.of(
            "hostname", InetAddress.getLocalHost().getHostName(),
            "os", System.getProperty("os.name")
        ));

        sendMessage(registerMsg);

        // ACK 대기
        String json = MessageProtocol.receiveMessage(socket.getInputStream());
        AgentMessage ack = mapper.readValue(json, AgentMessage.class);
        System.out.println("등록 완료: " + ack.getData());
    }

    private void startHeartbeat() {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                AgentMessage heartbeat = new AgentMessage();
                heartbeat.setType(AgentMessage.Type.HEARTBEAT);
                heartbeat.setAgentId(agentId);
                sendMessage(heartbeat);
            } catch (IOException e) {
                System.err.println("하트비트 전송 실패: " + e.getMessage());
            }
        }, 60, 60, TimeUnit.SECONDS);
    }

    private void listenForCommands() throws IOException {
        while (!socket.isClosed()) {
            String json = MessageProtocol.receiveMessage(socket.getInputStream());
            AgentMessage msg = mapper.readValue(json, AgentMessage.class);

            if (msg.getType() == AgentMessage.Type.COMMAND) {
                handleCommand(msg);
            }
        }
    }

    private void handleCommand(AgentMessage cmd) {
        String action = cmd.getAction();
        System.out.println("명령 수신: " + action);

        // 명령 처리
        Map<String, Object> result = executeAction(action, cmd.getData());

        // 응답 전송
        AgentMessage response = AgentMessage.response(agentId, result);
        try {
            sendMessage(response);
        } catch (IOException e) {
            System.err.println("응답 전송 실패: " + e.getMessage());
        }
    }

    private Map<String, Object> executeAction(String action, Map<String, Object> data) {
        switch (action) {
            case "system_info":
                return Map.of(
                    "cpu_count", Runtime.getRuntime().availableProcessors(),
                    "memory_total", Runtime.getRuntime().totalMemory(),
                    "memory_free", Runtime.getRuntime().freeMemory()
                );
            case "execute_command":
                String cmd = (String) data.get("command");
                return executeCommand(cmd);
            default:
                return Map.of("error", "Unknown action: " + action);
        }
    }

    private Map<String, Object> executeCommand(String command) {
        try {
            Process process = Runtime.getRuntime().exec(command);
            int exitCode = process.waitFor();

            String output = new String(process.getInputStream().readAllBytes());
            String error = new String(process.getErrorStream().readAllBytes());

            return Map.of(
                "exit_code", exitCode,
                "output", output,
                "error", error
            );
        } catch (IOException | InterruptedException e) {
            return Map.of("error", e.getMessage());
        }
    }

    private void sendMessage(AgentMessage msg) throws IOException {
        msg.setTimestamp(System.currentTimeMillis());
        String json = mapper.writeValueAsString(msg);
        MessageProtocol.sendMessage(socket.getOutputStream(), json);
    }

    public void stop() {
        scheduler.shutdown();
        try {
            socket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 실행 예시

```java
public class Main {
    public static void main(String[] args) throws Exception {
        // 서버 시작
        Thread serverThread = new Thread(() -> {
            try {
                ConsoleServer server = new ConsoleServer();
                server.start();
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        serverThread.start();

        Thread.sleep(1000);

        // 에이전트 시작
        Agent agent = new Agent("agent-001", "localhost", 9999);
        Thread agentThread = new Thread(() -> {
            try {
                agent.start();
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        agentThread.start();

        // 명령 전송 테스트는 서버 측에서 수동으로 수행
    }
}
```

## TCP 통신에서 블로킹 문제와 해결

실제 에이전트 시스템에서 흔히 겪는 문제가 있습니다. 에이전트가 긴 작업을 처리하는 동안 서버의 PING에 응답하지 못하는 것입니다.

### 문제 상황

```text
Agent → 긴 작업 처리 중... (30초)
Console → PING 전송
Agent → 응답 못함 (긴 작업에 블로킹)
```

`readLine()`으로 메시지를 수신하는 스레드가 직접 긴 작업을 처리하면, 작업이 끝날 때까지 다음 메시지를 읽지 못합니다.

### 해결: Agent 내부 스레드 분리

TCP 수신 스레드와 작업 처리 스레드를 분리하고, `LinkedBlockingQueue`로 연결합니다.

```java
public class Agent {

    private final BlockingQueue<String> commandQueue = new LinkedBlockingQueue<>();
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    public void start() throws Exception {
        Socket socket = new Socket("서버IP", 9091);
        BufferedReader in  = new BufferedReader(
            new InputStreamReader(socket.getInputStream()));
        PrintWriter    out = new PrintWriter(socket.getOutputStream(), true);

        // 워커 스레드: 긴 작업 처리
        worker.submit(() -> {
            while (true) {
                String cmd = commandQueue.take();
                doLongTask(cmd);
                out.println("ACK: " + cmd);
            }
        });

        // 메인 스레드: TCP 수신 (블로킹 안됨)
        String line;
        while ((line = in.readLine()) != null) {
            if ("PING".equals(line)) {
                out.println("PONG");       // 즉시 응답
            } else {
                commandQueue.put(line);    // 큐에만 넣고 리턴
            }
        }
    }
}
```

### 실행 흐름

```text
TCP 수신 (메인 스레드)
   ├── PING → 즉시 PONG
   ├── 명령 → 큐에만 넣고 리턴
   └── 기타 → 즉시 처리

워커 스레드 (별도)
   └── 큐에서 명령 꺼내서 긴 작업 처리
```

핵심은 `submit()` 호출 시점에 새 스레드가 분기되어 메인 스레드와 병렬로 실행된다는 것입니다.

```text
시간 →

메인 스레드:  [start()]─[submit()]─[readLine 대기]─[PING→PONG]─[put(cmd)]
                             ↓
워커 스레드:             [생성]────[take() 대기]──────────────[꺼냄]─[doLongTask()]
```

긴 작업이 여러 개 동시에 들어온다면 `newFixedThreadPool(N)`으로 워커 수를 늘릴 수 있습니다.

## Spring Boot TCP 중계 시스템 구조

실무에서 Console-Server-Agent 구조로 TCP 통신을 설계할 때의 아키텍처 패턴입니다.

### 시스템 구조

```text
Console (명령 발신)
    ↓ TCP
Spring Boot Server
    ├── PostgreSQL (명령 큐 + 이력)
    ├── TCP → Agent 1
    └── TCP → Agent 2
```

- Console이 직접 Agent와 통신하지 않고, Spring Boot Server가 중계
- Agent는 DB 연결 불필요 (TCP 통신만 담당)
- DB 관련 작업(명령 저장, 이력 관리)은 Spring Boot 서버가 전담

### 명령 유실 방지가 필요한 경우

TCP만으로는 서버나 Agent 재시작 시 처리 중이던 명령이 유실될 수 있습니다. 이런 경우 DB 기반 명령 큐를 도입합니다.

| 상황 | 설명 |
|------|------|
| 서버/Agent 재시작 시 명령 유실 방지 | Agent 재시작 후 PENDING 명령 재전송 |
| 명령 처리 순서 보장 | 재시작해도 순서 유지 |
| 감사 로그 / 이력 관리 | 언제 누가 어떤 명령을 내렸는지 추적 |
| 여러 서버 동시 처리 | `SELECT ... FOR UPDATE SKIP LOCKED`로 중복 실행 방지 |

PostgreSQL을 메시지 큐처럼 사용하는 대표적인 방식:

| 방식 | 장점 | 단점 | 추천 상황 |
|------|------|------|-----------|
| PGMQ | 전용 큐 기능, visibility timeout | PostgreSQL 확장 설치 필요 | 전문적인 MQ 기능 필요 시 |
| LISTEN/NOTIFY | 실시간, 내장 기능 | 메시지 유실 가능 | 실시간 알림/이벤트 |
| 테이블 기반 | 단순, 메시지 영속성 보장 | 폴링 필요 | 안정성이 중요할 때 |

> **판단 기준**: "서버나 Agent가 죽어도 명령이 반드시 실행되어야 한다"는 요구사항이 있으면 DB 기반 큐가 필요합니다. 단순 실시간 통신만 필요하면 TCP + Agent 내부 스레드 분리로 충분합니다.

## 마무리

이번 포스트에서는 Java 소켓 프로그래밍의 기초부터 실전 응용까지 다뤘습니다.

**핵심 내용 정리:**
- TCP는 신뢰성 있는 연결 지향 프로토콜
- `ServerSocket`과 `Socket`으로 클라이언트-서버 구현
- Length-prefixed framing으로 메시지 경계 명확화
- JSON으로 구조화된 프로토콜 설계
- 스레드풀로 멀티 클라이언트 처리
- 하트비트로 연결 상태 모니터링
- 지수 백오프 재연결 전략
- 버퍼링으로 I/O 성능 최적화
- 스레드 분리(LinkedBlockingQueue)로 PING 블로킹 문제 해결
- Spring Boot TCP 중계 구조와 DB 기반 명령 큐로 유실 방지

**다음 단계:**
- WebSocket과 STOMP 프로토콜 학습
- Netty 프레임워크로 고성능 서버 구현
- 프로토콜 버퍼(Protobuf) 적용
- TLS/SSL로 암호화 통신 구현
- PostgreSQL PGMQ / LISTEN·NOTIFY 실전 적용

소켓 프로그래밍은 네트워크 통신의 가장 기본이 되는 기술입니다. 이 기초를 탄탄히 다지면 더 고급 네트워크 프레임워크도 쉽게 이해할 수 있습니다.
