import BrandCard from "../components/brands/brandCard";
import { useFashionReps } from "../context/fashionRepsContext";

export default function TrustedSellersPage() {
  const { brands, loading, error, refetch } = useFashionReps();

  const displayError = () => {
    return (
      <div className="error-message">
        <p>Erreur lors du chargement des marques de confiance.</p>
        <p>{error}</p>
        <button onClick={refetch}>Réessayer</button>
      </div>
    );
  };

  return (
    <div className="trusted-sellers-page">
      {error ? (
        displayError()
      ) : loading ? (
        <p>Chargement en cours...</p>
      ) : (
        <div className="trusted-sellers-list">
          {brands.map((brand, index) => (
            <BrandCard key={index} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
