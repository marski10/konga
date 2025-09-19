# Route Alerts - Konga

Este documento descreve a funcionalidade de alertas para criação, atualização e exclusão de rotas no Konga.

## Visão Geral

O sistema de alertas de rotas permite que os administradores sejam notificados quando:
- Uma nova rota é criada
- Uma rota existente é atualizada
- Uma rota é excluída

As notificações podem ser enviadas via:
- Email
- Slack
- Notificações em tempo real no frontend (WebSocket)

## Configuração

### 1. Habilitar Notificações de Email

1. Acesse **Settings** no menu lateral
2. Configure o **Email Transport** (SMTP, Mailgun, ou Sendmail)
3. Ative **Email Notifications**
4. Configure os campos de email (sender name, sender email)

### 2. Habilitar Notificações de Slack

1. Acesse **Settings** > **Integrations**
2. Configure o **Slack Webhook URL**
3. Ative a integração do Slack

### 3. Habilitar Alertas de Rotas

1. Acesse **Settings**
2. Na seção **Notifications**, encontre:
   - **A route has been created** - Notificar quando rotas são criadas
   - **A route has been updated** - Notificar quando rotas são atualizadas
   - **A route has been deleted** - Notificar quando rotas são excluídas
3. Ative as notificações desejadas

## Funcionamento

### Backend

O sistema funciona através de hooks no `KongProxyController`:

1. **Criação de Rotas**: Quando uma rota é criada via `POST /kong/routes`, o hook `afterCreate` é executado
2. **Atualização de Rotas**: Quando uma rota é atualizada via `PATCH /kong/routes/:id`, o hook `afterUpdate` é executado
3. **Exclusão de Rotas**: Quando uma rota é excluída via `DELETE /kong/routes/:id`, o hook `afterDelete` é executado

### Frontend

O `NotificationsService` escuta os eventos via WebSocket:
- `route.created` - Nova rota criada
- `route.updated` - Rota atualizada
- `route.deleted` - Rota excluída

### Estrutura dos Arquivos

```
api/
├── events/
│   └── route-alerts.js          # Gerenciador de eventos de rotas
├── services/
│   └── KongProxyHooks.js        # Hooks para entidades Kong
├── controllers/
│   └── KongProxyController.js   # Proxy para Kong Admin API
└── models/
    └── Settings.js              # Configurações do sistema

assets/js/app/core/services/
└── NotificationsService.js      # Serviço de notificações frontend
```

## Exemplo de Uso

### 1. Criar uma Rota

```bash
curl -X POST http://localhost:1337/kong/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-route",
    "paths": ["/api/v1"],
    "service": {"id": "my-service-id"}
  }'
```

**Resultado**: Uma notificação será enviada se os alertas estiverem habilitados.

### 2. Atualizar uma Rota

```bash
curl -X PATCH http://localhost:1337/kong/routes/my-route-id \
  -H "Content-Type: application/json" \
  -d '{
    "paths": ["/api/v1", "/api/v2"]
  }'
```

**Resultado**: Uma notificação será enviada se os alertas estiverem habilitados.

### 3. Excluir uma Rota

```bash
curl -X DELETE http://localhost:1337/kong/routes/my-route-id
```

**Resultado**: Uma notificação será enviada se os alertas estiverem habilitados.

## Personalização

### Modificar Templates de Email

Edite as funções `makeHTMLNotification` e `makePlainTextNotification` em `api/events/route-alerts.js`:

```javascript
function makeHTMLNotification(route, connection, user, action) {
  // Personalize o template HTML aqui
}
```

### Adicionar Novos Tipos de Notificação

1. Adicione o novo tipo em `api/models/Settings.js` na seção `notify_when`
2. Crie a função de notificação em `api/events/route-alerts.js`
3. Adicione o listener no `NotificationsService.js`

### Modificar Notificações Frontend

Edite o `NotificationsService.js` para personalizar as mensagens exibidas:

```javascript
$rootScope.$on('route.created', function(event, data) {
  // Personalize a notificação aqui
});
```

## Troubleshooting

### Notificações não são enviadas

1. Verifique se as notificações estão habilitadas nas configurações
2. Verifique se o email transport está configurado corretamente
3. Verifique os logs do Konga para erros

### Notificações duplicadas

1. Verifique se não há múltiplas instâncias do Konga rodando
2. Verifique se os hooks não estão sendo executados múltiplas vezes

### WebSocket não funciona

1. Verifique se o Socket.io está configurado corretamente
2. Verifique se o cliente está conectado ao WebSocket

## Logs

Os logs das notificações podem ser encontrados no console do Konga:

```
route-alerts:notifyRouteCreated:success
route-alerts:notifyRouteUpdated:success
route-alerts:notifyRouteDeleted:success
```

## Limitações

- As notificações são enviadas apenas para administradores
- O sistema não suporta notificações personalizadas por usuário
- As notificações de atualização podem ser frequentes em ambientes com muitas mudanças

## Contribuição

Para contribuir com melhorias no sistema de alertas:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste thoroughly
5. Submeta um pull request

## Changelog

### v0.14.9
- Adicionado sistema de alertas para rotas
- Suporte a notificações via email, Slack e WebSocket
- Configurações personalizáveis nas settings
- Hooks para criação, atualização e exclusão de rotas
