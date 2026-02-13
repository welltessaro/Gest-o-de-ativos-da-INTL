
import { Asset, UserAccount } from '../types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

const getConfigs = () => {
  try {
    const stored = localStorage.getItem('assettrack_integrations');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const sendMaintenanceAlert = async (asset: Asset, reason: string, user: UserAccount) => {
  const configs = getConfigs();
  
  if (!configs?.telegramBotToken || !configs?.telegramChatId) {
    console.warn('Telegram não configurado. Notificação ignorada.');
    return;
  }

  const message = `
🚨 *NOVA SOLICITAÇÃO DE REPARO* 🚨

📦 *Ativo:* ${asset.type} ${asset.brand} ${asset.model}
🆔 *ID:* \`${asset.id}\`
🏷️ *Tag:* ${asset.tagId || 'N/A'}

👤 *Solicitante:* ${user.name} (${user.sector})
📝 *Motivo:*
_${reason}_

📅 *Data:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
  `.trim();

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${configs.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: configs.telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      console.error('Falha ao enviar Telegram:', await response.text());
    }
  } catch (error) {
    console.error('Erro de rede Telegram:', error);
  }
};
