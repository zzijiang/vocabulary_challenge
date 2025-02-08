// server.js
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 添加静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

const app = express();
const PORT = process.env.PORT || 3001;
const SCORES_FILE = path.join(__dirname, 'scores.csv');
const VOCABULARY_FILE = path.join(__dirname, 'vocabulary.csv');

app.use(express.json());
app.use(cors());

// 确保CSV文件存在并包含表头
async function ensureFile() {
  try {
    await fs.access(SCORES_FILE);
  } catch {
    const header = 'name,school,className,correctCount,wrongCount,skippedCount,completedAt\n';
    await fs.writeFile(SCORES_FILE, header, 'utf8');
  }
}

// 添加通配符路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 获取词库数据
app.get('/api/vocabulary', async (req, res) => {
  try {
    const data = await fs.readFile(VOCABULARY_FILE, 'utf8');
    const lines = data.trim().split('\n');
    const headers = lines[0].split(',');
    
    const words = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        english: values[0],
        chinese: values[1]
      };
    });

    res.json(words);
  } catch (error) {
    console.error('Error reading vocabulary:', error);
    res.status(500).json({ error: 'Failed to read vocabulary' });
  }
});

// 获取所有分数
app.get('/api/scores', async (req, res) => {
  try {
    await ensureFile();
    const data = await fs.readFile(SCORES_FILE, 'utf8');
    const lines = data.trim().split('\n');
    const headers = lines[0].split(',');
    
    const scores = lines.slice(1).map(line => {
      const values = line.split(',');
      const score = {};
      headers.forEach((header, index) => {
        score[header] = values[index];
      });
      return score;
    });

    res.json(scores);
  } catch (error) {
    console.error('Error reading scores:', error);
    res.status(500).json({ error: 'Failed to read scores' });
  }
});

// 添加新分数
app.post('/api/scores', async (req, res) => {
  try {
    await ensureFile();
    const { name, school, className, correctCount, wrongCount, skippedCount, completedAt } = req.body;
    
    const newScore = `${name},${school},${className},${correctCount},${wrongCount},${skippedCount},${completedAt}\n`;
    
    await fs.appendFile(SCORES_FILE, newScore, 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});