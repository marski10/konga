# 🔧 Konga Debug Guide

Este guia contém instruções para debugar o Konga, especialmente a funcionalidade de alertas de rotas que implementamos.

## 📁 Arquivos de Debug Criados

- `.vscode/launch.json` - Configurações de debug do VS Code
- `.vscode/tasks.json` - Tasks para build e execução
- `.vscode/settings.json` - Configurações do editor
- `.vscode/extensions.json` - Extensões recomendadas
- `debug-route-alerts.js` - Script para testar alertas de rotas
- `debug-frontend.html` - Interface para testar frontend

## 🚀 Como Usar o Debug

### 1. Debug do Backend (Node.js)

#### Opção A: Usar VS Code Debug
1. Abra o projeto no VS Code
2. Vá para a aba "Run and Debug" (Ctrl+Shift+D)
3. Selecione uma das configurações de debug:
   - **Debug Konga Backend** - Desenvolvimento com sails-disk
   - **Debug Konga Backend (MongoDB)** - Com MongoDB
   - **Debug Konga Backend (PostgreSQL)** - Com PostgreSQL
   - **Debug Konga Backend (MySQL)** - Com MySQL
   - **Debug Konga Backend (No Auth)** - Sem autenticação
   - **Debug Konga Route Alerts** - Focado em alertas de rotas

#### Opção B: Debug via Terminal
```bash
# Instalar dependências
npm install
npm run bower-deps

# Executar com debug
node --inspect --harmony app.js

# Ou com breakpoints específicos
node --inspect-brk --harmony app.js
```

### 2. Debug do Frontend (AngularJS)

#### Usar o Debug Tool
1. Inicie o Konga normalmente
2. Acesse: `http://localhost:1337/debug-frontend.html`
3. Use a interface para testar:
   - Conexão com backend
   - Autenticação
   - WebSocket events
   - Alertas de rotas

#### Debug no Browser
1. Abra DevTools (F12)
2. Vá para Console
3. Use os comandos de debug:
```javascript
// Verificar credenciais
console.log(localStorage.getItem('credentials'));

// Verificar conexão WebSocket
console.log(io.socket);

// Simular evento de rota
io.socket.emit('route.created', {route: {id: 'test'}});
```

### 3. Testar Alertas de Rotas

#### Script de Teste Standalone
```bash
# Executar script de debug
node debug-route-alerts.js
```

#### Teste Manual via API
```bash
# Criar uma rota (substitua o token)
curl -X POST http://localhost:1337/kong/routes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "connection-id: YOUR_NODE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-route",
    "paths": ["/api/test"],
    "service": {"id": "your-service-id"}
  }'
```

## 🐛 Pontos de Debug Importantes

### 1. KongProxyHooks.js
```javascript
// Adicionar breakpoints em:
afterCreate: function(req, data, konga_extras, next) {
  // Breakpoint aqui para debug de criação
  console.log('Route created:', data);
  console.log('User:', req.token);
  console.log('Connection:', req.connection);
}
```

### 2. route-alerts.js
```javascript
// Adicionar breakpoints em:
notifyRouteCreated: function(route, connection, user) {
  // Breakpoint aqui para debug de notificações
  console.log('Notifying route created:', {route, connection, user});
}
```

### 3. NotificationsService.js (Frontend)
```javascript
// Adicionar breakpoints em:
$rootScope.$on('route.created', function(event, data) {
  // Breakpoint aqui para debug de eventos frontend
  console.log('Route created event received:', data);
});
```

## 📊 Logs de Debug

### Backend Logs
```bash
# Habilitar logs detalhados
export KONGA_LOG_LEVEL=debug
npm start
```

### Frontend Logs
```javascript
// No console do browser
localStorage.setItem('debug', 'true');
// Recarregar a página
```

## 🔍 Troubleshooting

### Problema: Alertas não são enviados
1. Verificar se as notificações estão habilitadas nas settings
2. Verificar logs do backend para erros
3. Verificar se o email transport está configurado
4. Verificar se o WebSocket está conectado

### Problema: WebSocket não conecta
1. Verificar se o Konga está rodando
2. Verificar se o Socket.io está carregado
3. Verificar console do browser para erros

### Problema: Usuário não é recuperado
1. Verificar se o JWT token é válido
2. Verificar se o usuário existe no banco
3. Verificar logs do KongProxyHooks

## 📝 Exemplos de Debug

### Testar Criação de Rota
```javascript
// No console do browser
fetch('/kong/routes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('credentials')).token,
    'connection-id': JSON.parse(localStorage.getItem('credentials')).user.node.id,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'debug-route',
    paths: ['/api/debug'],
    service: {id: 'your-service-id'}
  })
}).then(r => r.json()).then(console.log);
```

### Simular Evento de Rota
```javascript
// No console do browser
io.socket.emit('route.created', {
  route: {id: 'test', name: 'test-route'},
  connection: {name: 'Test Node'},
  user: {username: 'testuser'},
  timestamp: new Date()
});
```

## 🎯 Breakpoints Recomendados

1. **KongProxyHooks.js:212** - Route created hook
2. **route-alerts.js:45** - Notify route created
3. **NotificationsService.js:77** - Frontend route event
4. **KongProxyController.js:147** - POST request handling
5. **authenticated.js:42** - Token verification

## 📚 Recursos Adicionais

- [Sails.js Debugging](https://sailsjs.com/documentation/concepts/debugging)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [AngularJS Debugging](https://docs.angularjs.org/guide/debugging)
- [Socket.io Debugging](https://socket.io/docs/v4/troubleshooting-connection-issues/)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Use o debug tool do frontend
3. Execute o script de debug standalone
4. Verifique as configurações de banco de dados
5. Verifique se todas as dependências estão instaladas

