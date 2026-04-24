import axios from 'axios';

// interface for the result
export interface PredictionResult {
  genome: {
    header: string;
    seq_length: number;
    gc_pct: number;
    organism_match: boolean;
    matched_genus: string | null;
  };
  predictions: {
    antibiotic: string;
    phenotype: 'Resistant' | 'Susceptible';
    confidence: number;
    model: string;
    trust_score: number;
    confidence_tier: string;
    det_found: boolean;
  }[];
  recommendation: any;
  clinical: any;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Uploads a genome file for resistance prediction.
 */
export const uploadGenome = async (
  file: File, 
  patientName?: string,
  age?: string,
  dob?: string,
  gender?: string
): Promise<PredictionResult> => {
  const formData = new FormData();
  formData.append('fasta', file); // Matches backend expected field name
  if (patientName) formData.append('patientName', patientName);
  if (age) formData.append('patientAge', age);
  if (dob) formData.append('patientDob', dob);
  if (gender) formData.append('patientGender', gender);

  try {
    const response = await api.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
