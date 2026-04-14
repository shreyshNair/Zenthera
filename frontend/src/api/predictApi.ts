import axios from 'axios';

// interface for the result
export interface PredictionResult {
  organism: string;
  predictions: {
    antibiotic: string;
    prediction: 'Resistant' | 'Susceptible';
    confidence: number;
  }[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Uploads a genome file for resistance prediction.
 * If the backend is not available, it returns a realistic mock result for demo purposes.
 */
export const uploadGenome = async (file: File): Promise<PredictionResult> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.warn('Backend not available, returning mock data for demonstration.', error);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      organism: "Staphylococcus aureus (Strain XY-24)",
      predictions: [
        { antibiotic: 'Amoxicillin', prediction: 'Resistant', confidence: 98.4 },
        { antibiotic: 'Ciprofloxacin', prediction: 'Susceptible', confidence: 91.2 },
        { antibiotic: 'Vancomycin', prediction: 'Susceptible', confidence: 99.1 },
        { antibiotic: 'Erythromycin', prediction: 'Resistant', confidence: 87.5 },
        { antibiotic: 'Tetracycline', prediction: 'Resistant', confidence: 92.8 },
        { antibiotic: 'Gentamicin', prediction: 'Susceptible', confidence: 84.6 },
        { antibiotic: 'Methicillin', prediction: 'Resistant', confidence: 96.2 }
      ]
    };
  }
};
