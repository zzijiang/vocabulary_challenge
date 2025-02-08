// src/lib/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // 生产环境使用相对路径
  : 'http://localhost:3001/api';

// 添加获取词库的函数
export async function fetchVocabulary() {
  const response = await fetch(`${API_BASE_URL}/vocabulary`);
  if (!response.ok) {
    throw new Error('Failed to fetch vocabulary');
  }
  return response.json();
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
