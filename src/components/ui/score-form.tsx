// components/ui/score-form.tsx
import React, { useState } from 'react';
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { GameStats, PlayerScore } from '../../types/leaderboard';

interface ScoreFormProps {
  stats: GameStats;
  onSubmit: (score: PlayerScore) => void;
  onSkip: () => void;
}

const ScoreForm: React.FC<ScoreFormProps> = ({ stats, onSubmit, onSkip }) => {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    className: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const playerScore: PlayerScore = {
      ...formData,
      ...stats,
    };
    onSubmit(playerScore);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>记录成绩</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">姓名</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">学校</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded"
              value={formData.school}
              onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">班级</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded"
              value={formData.className}
              onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
            />
          </div>
          <div className="pt-4 space-y-2">
            <Button type="submit" className="w-full">
              提交成绩
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={onSkip}>
              暂不记录
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ScoreForm;