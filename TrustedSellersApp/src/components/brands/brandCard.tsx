import type { Brand } from "../../types/types";

interface BrandCardProps {
  brand: Brand;
}

export default function BrandCard({ brand }: BrandCardProps) {
  return (
    <div className="brand-card">
      <h3>{brand.name}</h3>
      <ul>
        {brand.sellers.map((seller, index) => (
          <li key={index}>
            <a href={seller.url} target="_blank" rel="noopener noreferrer">
              {seller.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
