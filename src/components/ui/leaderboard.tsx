// components/ui/leaderboard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { PlayerScore } from '../../types/leaderboard';

interface LeaderboardProps {
  scores: PlayerScore[];
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores, onClose }) => {
  // 排序规则：首先按正确数降序，然后错误数升序，然后跳过数升序，最后用时升序
  const sortedScores = [...scores].sort((a, b) => {
    if (a.correctCount !== b.correctCount) {
      return b.correctCount - a.correctCount;
    }
    if (a.wrongCount !== b.wrongCount) {
      return a.wrongCount - b.wrongCount;
    }
    if (a.skippedCount !== b.skippedCount) {
      return a.skippedCount - b.skippedCount;
    }
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>排行榜</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">排名</th>
                <th className="py-2 px-4 text-left">姓名</th>
                <th className="py-2 px-4 text-left">学校</th>
                <th className="py-2 px-4 text-left">班级</th>
                <th className="py-2 px-4 text-right">答对</th>
                <th className="py-2 px-4 text-right">答错</th>
                <th className="py-2 px-4 text-right">跳过</th>
                <th className="py-2 px-4 text-right">完成时间</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((score, index) => (
                <tr key={`${score.name}-${score.completedAt}`} className="border-b">
                  <td className="py-2 px-4">{index + 1}</td>
                  <td className="py-2 px-4">{score.name}</td>
                  <td className="py-2 px-4">{score.school}</td>
                  <td className="py-2 px-4">{score.className}</td>
                  <td className="py-2 px-4 text-right text-green-600">{score.correctCount}</td>
                  <td className="py-2 px-4 text-right text-red-600">{score.wrongCount}</td>
                  <td className="py-2 px-4 text-right text-orange-600">{score.skippedCount}</td>
                  <td className="py-2 px-4 text-right">{score.completedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;