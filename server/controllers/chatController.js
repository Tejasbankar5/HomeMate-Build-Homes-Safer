// // controllers/serviceProviderChatController.js
// const db = require("../config/db");
// // const socket = require("../socket");

// exports.getConversations = async (req, res) => {
//   try {
//     const email = req.cookies.email;
//     const [provider] = await db.query("SELECT id FROM service_providers_authdata WHERE email = ?", [email]);
//     const providerId = provider[0].id;

//     const [conversations] = await db.query(
//       `SELECT c.id as conversation_id, cl.id as client_id, cl.email as client_email
//       FROM conversations c
//       JOIN clientsdata cl ON c.client_id = cl.id
//       WHERE c.service_provider_id = ?`, [providerId]);

//     res.json(conversations);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// };

// exports.getMessages = async (req, res) => {
//   try {
//     const { conversationId } = req.params;
//     const [messages] = await db.query(
//       "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
//       [conversationId]
//     );
//     res.json({ messages });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// };

// exports.sendMessage = async (req, res) => {
//   try {
//     const email = req.cookies.email;
//     const [provider] = await db.query("SELECT id FROM service_providers_authdata WHERE email = ?", [email]);
//     const providerId = provider[0].id;

//     const { conversation_id, message_text } = req.body;

//     await db.query(
//       `INSERT INTO messages (conversation_id, sender_id, sender_type, message_text)
//        VALUES (?, ?, 'service_provider', ?)`,
//       [conversation_id, providerId, message_text]
//     );

//     socket.getIO().emit("new_message", { conversation_id });

//     res.status(201).send("Message sent");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// };
