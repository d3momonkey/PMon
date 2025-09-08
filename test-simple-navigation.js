// Simple test to check if basic navigation works
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, setting up simple test...');
  
  // Wait a bit for everything to load
  setTimeout(() => {
    const cards = document.querySelectorAll('.metric-card');
    console.log('Found cards:', cards.length);
    
    cards.forEach((card, index) => {
      console.log(`Card ${index}:`, card.classList.toString());
      
      card.addEventListener('click', (e) => {
        console.log('TEST: Card clicked!', card.classList.toString());
        
        // Simple navigation test
        const cardClass = Array.from(card.classList).find(cls => cls.endsWith('-card'));
        if (cardClass) {
          const section = cardClass.replace('-card', '');
          console.log('TEST: Should navigate to:', section);
          
          // Simple section switching
          document.querySelectorAll('.content-section').forEach(s => {
            s.classList.remove('active');
            console.log('Hiding:', s.id);
          });
          
          const targetSection = document.getElementById(`${section}-section`);
          if (targetSection) {
            targetSection.classList.add('active');
            console.log('Showing:', targetSection.id);
            
            // Force visible styling
            targetSection.style.display = 'block';
            targetSection.style.background = 'red'; // Temporary test color
            targetSection.innerHTML = `<h1>TEST: ${section.toUpperCase()} SECTION</h1><p>This is a test to verify navigation works.</p>`;
          } else {
            console.error('Section not found:', `${section}-section`);
          }
        }
      });
    });
  }, 2000);
});
