// src/lib/api.ts
const API_BASE_URL = window.location.hostname === 'localhost'
  ? '/api'  // 生产环境
  : 'http://localhost:3001/api';  // 开发环境

export async function fetchVocabulary() {
  try {
    console.log('Fetching vocabulary from:', `${API_BASE_URL}/vocabulary`); // 添加调试日志
    const response = await fetch(`${API_BASE_URL}/vocabulary`);
    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary');
    }
    const data = await response.json();
    console.log('Vocabulary data:', data); // 添加调试日志
    return data;
  } catch (error) {
    console.error('Vocabulary fetch error:', error); // 添加错误日志
    throw error;
  }
}

export async function fetchScores() {
  const response = await fetch(`${API_BASE_URL}/scores`);
  if (!response.ok) {
    throw new Error('Failed to fetch scores');
  }
  return response.json();
}

export async function saveScore(scoreData: any) {
  const response = await fetch(`${API_BASE_URL}/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scoreData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save score');
  }
  return response.json();
}
