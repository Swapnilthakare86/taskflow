// Purpose: Contains shared presentational UI primitives used across screens.
/* Avatar.jsx */
/**
 * Avatar Component - displays user initials in a colored circle
 * @param {Object} user - User object with avatar_color, color, initials, name
 * @param {number} size - Avatar diameter in pixels
 * @param {Object} style - Additional inline styles
 */
export default function Avatar({ user, size = 32, style = {} }) {
  if (!user) return null;
  
  // Calculate font size proportional to avatar size
  const fontSize = Math.round(size * 0.32);
  
  return (
    <div
      className="tf-avatar"
      style={{
        width: size, height: size,
        background: user.avatar_color || user.color || '#3B82F6',
        fontSize,
        ...style,
      }}
    >
      {/* Display user initials or generate from name */}
      {user.initials || (user.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?')}
    </div>
  );
}


