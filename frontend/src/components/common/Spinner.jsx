// Purpose: Contains shared presentational UI primitives used across screens.
/**
 * Spinner Component - displays loading indicator
 * @param {boolean} sm - Use small spinner size variant
 */
export default function Spinner({ sm = false }) {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className={sm ? 'tf-spinner tf-spinner-sm' : 'tf-spinner'} />
    </div>
  );
}


