export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const webhookUrl = "https://n8n.iswstudioweb.com/webhook/1844fc2e-7878-4e7c-a5fa-c1c12b3147ea";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al enviar al webhook:", error);
    res.status(500).json({ error: "Error al enviar al webhook" });
  }
}
