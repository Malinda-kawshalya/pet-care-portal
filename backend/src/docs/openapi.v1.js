const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Pet Care Portal API",
    version: "1.0.0",
    description: "OpenAPI specification for all /api/v1 endpoints",
  },
  servers: [
    {
      url: "/api/v1",
      description: "v1 API base",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    "/health": {
      get: { summary: "Health check", tags: ["Health"] },
    },
    "/auth/register": {
      post: { summary: "Register adopter account", tags: ["Auth"] },
    },
    "/auth/login": {
      post: { summary: "Login", tags: ["Auth"] },
    },
    "/auth/forgot-password": {
      post: { summary: "Request password reset", tags: ["Auth"] },
    },
    "/auth/reset-password": {
      post: { summary: "Reset password with token", tags: ["Auth"] },
    },
    "/auth/me": {
      get: { summary: "Current authenticated user", tags: ["Auth"], security: [{ bearerAuth: [] }] },
    },
    "/auth/logout": {
      post: { summary: "Logout", tags: ["Auth"], security: [{ bearerAuth: [] }] },
    },
    "/users": {
      post: { summary: "Create admin/vet user (admin only)", tags: ["Users"], security: [{ bearerAuth: [] }] },
    },
    "/pets": {
      get: { summary: "Public pet listing/search", tags: ["Pets"] },
    },
    "/pets/{id}": {
      get: {
        summary: "Get pet details",
        tags: ["Pets"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/admin/pets": {
      get: { summary: "Admin pet listing", tags: ["Admin Pets"], security: [{ bearerAuth: [] }] },
      post: { summary: "Create pet", tags: ["Admin Pets"], security: [{ bearerAuth: [] }] },
    },
    "/admin/pets/{id}": {
      put: {
        summary: "Update pet",
        tags: ["Admin Pets"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
      delete: {
        summary: "Soft delete pet",
        tags: ["Admin Pets"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/applications": {
      get: { summary: "List applications", tags: ["Applications"], security: [{ bearerAuth: [] }] },
      post: { summary: "Submit adoption application", tags: ["Applications"], security: [{ bearerAuth: [] }] },
    },
    "/applications/{id}/status": {
      patch: {
        summary: "Update application status",
        tags: ["Applications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/notifications": {
      get: { summary: "List notifications", tags: ["Notifications"], security: [{ bearerAuth: [] }] },
    },
    "/notifications/{notificationId}/read": {
      patch: {
        summary: "Mark notification as read",
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "notificationId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/notifications/read-all": {
      patch: { summary: "Mark all notifications as read", tags: ["Notifications"], security: [{ bearerAuth: [] }] },
    },
    "/notifications/preferences": {
      get: { summary: "Get notification preferences", tags: ["Notifications"], security: [{ bearerAuth: [] }] },
      put: { summary: "Update notification preferences", tags: ["Notifications"], security: [{ bearerAuth: [] }] },
    },
    "/care-guide/{petId}": {
      get: {
        summary: "Get care guide",
        tags: ["Care Guide"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/care-guide/{petId}/export/pdf": {
      get: {
        summary: "Export care guide PDF",
        tags: ["Care Guide"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/care-guide/{petId}/regenerate": {
      post: {
        summary: "Regenerate care guide",
        tags: ["Care Guide"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/care-guide/{petId}/verify": {
      patch: {
        summary: "Verify care guide",
        tags: ["Care Guide"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/health-events/adopter/events": {
      get: { summary: "Adopter health events", tags: ["Health Events"], security: [{ bearerAuth: [] }] },
    },
    "/health-events/pet/{petId}/event": {
      post: {
        summary: "Create health event",
        tags: ["Health Events"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/health-events/pet/{petId}/events": {
      get: {
        summary: "Get pet health events",
        tags: ["Health Events"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/health-events/event/{eventId}": {
      get: {
        summary: "Get event detail",
        tags: ["Health Events"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }],
      },
      patch: {
        summary: "Update health event",
        tags: ["Health Events"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }],
      },
      delete: {
        summary: "Delete health event",
        tags: ["Health Events"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/health-events/event/{eventId}/complete": {
      post: {
        summary: "Complete health event",
        tags: ["Health Events"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/health-events/reminders/trigger": {
      post: { summary: "Trigger reminders", tags: ["Health Events"], security: [{ bearerAuth: [] }] },
    },
    "/qr/{petId}/public": {
      get: { summary: "Public QR profile", tags: ["QR"], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/qr/{petId}": {
      get: { summary: "Public QR profile (legacy alias)", tags: ["QR"], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/qr/{petId}/scan": {
      post: { summary: "Log QR scan", tags: ["QR"], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/qr/{petId}/download": {
      get: { summary: "Download QR PNG", tags: ["QR"], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/qr/nearby/list": {
      get: { summary: "Nearby lost/found pets", tags: ["QR"] },
    },
    "/qr/{petId}/history": {
      get: { summary: "QR scan history", tags: ["QR"], security: [{ bearerAuth: [] }], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/qr/{petId}/lost": {
      post: { summary: "Report pet lost", tags: ["QR"], security: [{ bearerAuth: [] }], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/qr/{petId}/found": {
      post: { summary: "Mark pet found", tags: ["QR"], security: [{ bearerAuth: [] }], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/qr/{petId}/regenerate": {
      post: { summary: "Regenerate QR", tags: ["QR"], security: [{ bearerAuth: [] }], parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/feed": {
      get: { summary: "Community feed", tags: ["Community"] },
    },
    "/community/posts": {
      get: { summary: "Community posts", tags: ["Community"] },
      post: { summary: "Create post", tags: ["Community"], security: [{ bearerAuth: [] }] },
    },
    "/community/posts/{postId}": {
      get: { summary: "Get post", tags: ["Community"], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
      patch: { summary: "Update post", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
      delete: { summary: "Delete post", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/posts/{postId}/like": {
      post: { summary: "Like/unlike post", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/posts/{postId}/report": {
      post: { summary: "Report post", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/posts/{postId}/share": {
      post: { summary: "Share post", tags: ["Community"], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/posts/{postId}/comments": {
      get: { summary: "List comments", tags: ["Community"], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
      post: { summary: "Create comment", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/comments/{commentId}": {
      patch: { summary: "Update comment", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "commentId", in: "path", required: true, schema: { type: "string" } }] },
      delete: { summary: "Delete comment", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "commentId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/comments/{commentId}/like": {
      post: { summary: "Like/unlike comment", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "commentId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/comments/{commentId}/report": {
      post: { summary: "Report comment", tags: ["Community"], security: [{ bearerAuth: [] }], parameters: [{ name: "commentId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/moderation/flagged": {
      get: { summary: "Flagged moderation queue", tags: ["Community Moderation"], security: [{ bearerAuth: [] }] },
    },
    "/community/moderation/posts/{postId}": {
      post: { summary: "Moderate post", tags: ["Community Moderation"], security: [{ bearerAuth: [] }], parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/community/moderation/comments/{commentId}": {
      post: { summary: "Moderate comment", tags: ["Community Moderation"], security: [{ bearerAuth: [] }], parameters: [{ name: "commentId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/chat/conversations": {
      get: { summary: "List chat conversations", tags: ["Chat"], security: [{ bearerAuth: [] }] },
    },
    "/chat/conversations/{conversationId}/messages": {
      get: { summary: "List conversation messages", tags: ["Chat"], security: [{ bearerAuth: [] }], parameters: [{ name: "conversationId", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/chat/message": {
      post: { summary: "Send chat message", tags: ["Chat"], security: [{ bearerAuth: [] }] },
    },
    "/media/signature": {
      post: { summary: "Create Cloudinary upload signature", tags: ["Media"], security: [{ bearerAuth: [] }] },
    },
    "/media/upload": {
      post: { summary: "Upload image to Cloudinary via backend", tags: ["Media"], security: [{ bearerAuth: [] }] },
    },
  },
};

module.exports = { openApiSpec };
