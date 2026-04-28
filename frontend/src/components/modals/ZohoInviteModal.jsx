import { Mail, Send, X } from 'lucide-react';
import ModalOverlay from '../common/ModalOverlay';

export default function ZohoInviteModal({
  open,
  project,
  senderName,
  senderEmail,
  recipientEmail,
  sending = false,
  onRecipientChange,
  onSend,
  onClose,
}) {
  if (!open || !project) return null;

  const subject = `Invitation to join "${project.name}"`;
  const previewLink = `https://taskflow.app/invite/accept?token=INVITE_TOKEN`;
  const body = [
    'Hi,',
    '',
    `You've been invited to collaborate on the "${project.name}" project.`,
    '',
    'Click the link below to accept your invitation:',
    '',
    previewLink,
    '',
    'Best regards,',
    senderName || 'Project Manager',
  ].join('\n');

  return (
    <>
      <ModalOverlay onClose={onClose} />
      <div className="tf-modal tf-modal-w-lg tf-zoho">
        <div className="tf-zoho__head">
          <div className="d-flex align-items-center gap-2">
            <span className="tf-zoho__title">New Message</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="tf-topbar__icon-btn" onClick={onClose} aria-label="Close invite">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="tf-zoho__meta-row">
          <span className="tf-zoho__meta-k">From:</span>
          <span className="tf-zoho__meta-v">{senderName} &lt;{senderEmail}&gt;</span>
        </div>
        <div className="tf-zoho__meta-row">
          <span className="tf-zoho__meta-k">To:</span>
          <input
            className="tf-zoho__to"
            value={recipientEmail}
            onChange={(e) => onRecipientChange?.(e.target.value)}
            placeholder="recipient@company.com"
            autoFocus
          />
        </div>
        <div className="tf-zoho__meta-row">
          <span className="tf-zoho__meta-k">Subject:</span>
          <span className="tf-zoho__meta-v">{subject}</span>
        </div>

        <textarea className="tf-zoho__body" value={body} readOnly />

        <div className="tf-zoho__foot">
          <div className="d-flex align-items-center gap-2">
            <button className="tf-zoho__send" onClick={onSend} disabled={sending || !recipientEmail.trim()}>
              <Send size={12} />
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
            <button className="tf-zoho__discard" onClick={onClose} disabled={sending}>
              Discard
            </button>
          </div>
          <div className="tf-zoho__project-chip">
            <span className="tf-zoho__dot" />
            Invite to:
            <strong>{project.name}</strong>
          </div>
        </div>
      </div>
    </>
  );
}
