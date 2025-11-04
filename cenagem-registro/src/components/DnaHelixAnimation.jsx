import React from 'react';
import './DnaHelixAnimation.css';

const DnaHelixAnimation = () => {
  return (
    <div className="dna-container">
      <div className="dna-helix">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="dna-strand"></div>
        ))}
      </div>
    </div>
  );
};

export default DnaHelixAnimation;