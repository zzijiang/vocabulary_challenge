import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import ScoreForm from '@/components/ui/score-form';
import Leaderboard from '@/components/ui/leaderboard';
import { PlayerScore, GameStats } from '@/types/leaderboard';
import { Word, Mistake } from '@/types/word';
import { fetchScores, saveScore, fetchVocabulary } from '@/lib/api';

const GAME_DURATION = 300; // seconds
const INCORRECT_ANSWER_DELAY = 2000; // 2 seconds delay for incorrect answers

type GameState = 'start' | 'playing' | 'over' | 'review' | 'submitScore' | 'leaderboard';

const WordGuessingGame = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<PlayerScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 添加词库状态
  const [wordDatabase, setWordDatabase] = useState<Word[]>([]);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState(true);

  // 添加加载词库的 useEffect
  useEffect(() => {
    async function loadVocabulary() {
      try {
        setIsLoadingVocabulary(true);
        const words = await fetchVocabulary();
        setWordDatabase(words);
      } catch (error) {
        console.error('Failed to load vocabulary:', error);
      } finally {
        setIsLoadingVocabulary(false);
      }
    }

    loadVocabulary();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            endGame();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining]);

  // 数据获取效果
  useEffect(() => {
    async function loadScores() {
      try {
        setIsLoading(true);
        const scores = await fetchScores();
        setLeaderboardData(scores);
        setError(null);
      } catch (err) {
        setError('加载排行榜失败');
        console.error('Failed to load scores:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadScores();
  }, []);

  const endGame = () => {
    setIsActive(false);
    setGameState('over');
  };

  // Get random wrong answers
  const getWrongAnswers = (correctAnswer: string, count = 3): string[] => {
    const otherAnswers = wordDatabase
      .filter(word => word.chinese !== correctAnswer)
      .map(word => word.chinese);
    
    return shuffleArray(otherAnswers).slice(0, count);
  };

  // Initialize or reset the game
  const initializeGame = () => {
    let availableWords = wordDatabase.filter(word => !usedWords.has(word.english));
    
    if (availableWords.length === 0) {
      setUsedWords(new Set());
      availableWords = wordDatabase;
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    const wrongAnswers = getWrongAnswers(randomWord.chinese);
    const shuffledOptions = shuffleArray([randomWord.chinese, ...wrongAnswers]);
    
    setCurrentWord(randomWord);
    setOptions(shuffledOptions);
    setSelectedAnswer(null);
    setUsedWords(prev => new Set([...prev, randomWord.english]));
  };

  // Shuffle array helper function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Start the game
  const startGame = () => {
    setGameState('playing');
    setIsActive(true);
    initializeGame();
  };

  // Handle answer selection
  const handleAnswer = (answer: string, isSkip = false) => {
    if (!isActive || selectedAnswer !== null || !currentWord) return;
    
    setSelectedAnswer(answer);
    const isCorrect = !isSkip && answer === currentWord.chinese;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setTimeout(() => {
        moveToNextQuestion();
      }, 500);
    } else {
      setMistakes(prev => [...prev, {
        english: currentWord.english,
        chinese: currentWord.chinese,
        selectedAnswer: isSkip ? "Skipped" : answer
      }]);
      setTimeout(() => {
        moveToNextQuestion();
      }, INCORRECT_ANSWER_DELAY);
    }
  };

  // Move to next question
  const moveToNextQuestion = () => {
    if (!isActive) return;
    
    setCurrentQuestionNumber(prev => prev + 1);
    initializeGame();
  };

  // Reset the game
  const handleReset = () => {
    setScore(0);
    setCurrentQuestionNumber(1);
    setUsedWords(new Set());
    setTimeRemaining(GAME_DURATION);
    setIsActive(false);
    setSelectedAnswer(null);
    setMistakes([]);
    setGameState('start');
  };

  // 提交分数的处理函数
  const handleSubmitScore = async (playerScore: PlayerScore) => {
    try {
      setIsLoading(true);
      await saveScore(playerScore);
      const updatedScores = await fetchScores();
      setLeaderboardData(updatedScores);
      setGameState('leaderboard');
      setError(null);
    } catch (err) {
      setError('保存分数失败');
      console.error('Failed to save score:', err);
    } finally {
      setIsLoading(false);
    }
  };

// Start screen
if (gameState === 'start') {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardContent className="p-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Vocabulary Challenge</h1>
          
          {isLoadingVocabulary ? (
            <p className="text-lg mb-6">加载词库中...</p>
          ) : (
            <>
              <p className="text-lg mb-6">
                Test your English vocabulary! You have {GAME_DURATION} seconds to answer as many questions as possible.
              </p>
              <div className="space-y-4">
                <Button onClick={startGame} className="w-full text-lg h-16">
                  开始游戏
                </Button>
                {leaderboardData.length > 0 && (
                  <Button 
                    onClick={() => setGameState('leaderboard')} 
                    variant="outline" 
                    className="w-full text-lg h-16"
                  >
                    查看排行榜
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

  // Review mistakes screen
  if (gameState === 'review') {
    const skippedWords = mistakes.filter(m => m.selectedAnswer === "Skipped");
    const wrongAnswers = mistakes.filter(m => m.selectedAnswer !== "Skipped");

    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">复习</h2>
              <Button 
                variant="outline" 
                onClick={() => setGameState('over')}
                className="px-4"
              >
                返回
              </Button>
            </div>
            
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {/* Wrong answers section */}
              {wrongAnswers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-red-600">
                    答错的单词 ({wrongAnswers.length})
                  </h3>
                  <div className="divide-y">
                    {wrongAnswers.map((mistake, index) => (
                      <div key={index} className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-lg font-medium">{mistake.english}</div>
                            <div className="text-sm text-red-500 mt-1">
                              你的答案：{mistake.selectedAnswer}
                            </div>
                          </div>
                          <div className="text-lg font-medium text-green-600 ml-8">
                            {mistake.chinese}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped words section */}
              {skippedWords.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-orange-600">
                    跳过的单词 ({skippedWords.length})
                  </h3>
                  <div className="divide-y">
                    {skippedWords.map((mistake, index) => (
                      <div key={index} className="py-4">
                        <div className="flex justify-between items-center">
                          <div className="text-lg font-medium">{mistake.english}</div>
                          <div className="text-lg font-medium text-green-600 ml-8">
                            {mistake.chinese}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mistakes.length === 0 && (
                <p className="text-center text-lg py-8">恭喜！全部回答正确！🎉</p>
              )}
            </div>

            {/* <div className="mt-6">
              <Button onClick={handleReset} className="w-full">
                重新开始
              </Button>
            </div> */}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game over screen
  if (gameState === 'over') {
    const isPerfectScore = score === currentQuestionNumber - 1 && score > 0;

    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            {isPerfectScore ? (
              <>
                <style>
                  {`
                    @keyframes bouncetwice {
                      0%, 100% { transform: translateY(0); }
                      25%, 75% { transform: translateY(-15px); }
                      50% { transform: translateY(0); }
                    }
                    .bounce-twice {
                      animation: bouncetwice 2s ease-in-out;
                      animation-iteration-count: 1;
                    }
                  `}
                </style>
                <h2 className="text-4xl font-bold mb-6 text-green-600 bounce-twice">
                  全对！太棒了！
                </h2>
                <div className="text-6xl mb-8">🎉</div>
              </>
            ) : (
              <h2 className="text-2xl font-bold mb-4">时间到！</h2>
            )}
            
            <div className="space-y-2 mb-8">
              <p className="text-lg">答题数量：{currentQuestionNumber - 1}</p>
              <p className="text-lg">正确答案：{score}</p>
              <p className="text-lg">正确率：{Math.round((score / (currentQuestionNumber - 1)) * 100) || 0}%</p>
            </div>
            <div className="flex flex-col gap-4">
              {mistakes.length > 0 && (
                <Button 
                  onClick={() => setGameState('review')} 
                  variant="outline"
                  className="w-full text-lg"
                >
                  查看错题 ({mistakes.length})
                </Button>
              )}
              <Button 
                onClick={() => setGameState('submitScore')} 
                className="w-full text-lg"
              >
                记录成绩
              </Button>
              <Button onClick={handleReset} className="w-full text-lg">
                再次挑战
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 在游戏结束时获取当前北京时间
  const formatBeiJingTime = () => {
    const now = new Date();
    // 获取北京时间
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    // 格式化为 'YYYY-MM-DD HH:mm:ss' 格式
    return beijingTime.toISOString().slice(0, 19).replace('T', ' ');
  };

  if (gameState === 'submitScore') {
  const gameStats: GameStats = {
    correctCount: score,
    wrongCount: mistakes.filter(m => m.selectedAnswer !== "Skipped").length,
    skippedCount: mistakes.filter(m => m.selectedAnswer === "Skipped").length,
    completedAt: formatBeiJingTime()
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <ScoreForm 
        stats={gameStats}
        onSubmit={handleSubmitScore}
        onSkip={() => setGameState('leaderboard')}
      />
    </div>
  );
}

if (gameState === 'leaderboard') {
  return (
    <div className="max-w-2xl mx-auto p-4">
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p>加载中...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={handleReset} className="mt-4">
              返回
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Leaderboard 
          scores={leaderboardData}
          onClose={handleReset}
        />
      )}
    </div>
  );
}

  // Game screen
  if (!currentWord) {
    return null; // Or loading state
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">Time: {timeRemaining}s</span>
              <span className="text-lg font-semibold">Score: {score}</span>
            </div>
            <Progress value={(timeRemaining / GAME_DURATION) * 100} className="h-2" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Question {currentQuestionNumber}</h2>
            <p className="text-xl">Translate: <span className="font-bold">{currentWord.english}</span></p>
          </div>

          {/* Answer options container */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Four translation options in 2x2 grid */}
            <div className="grid grid-cols-2 gap-4">
              {options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => !selectedAnswer && handleAnswer(option)}
                  variant={selectedAnswer ? (
                    option === currentWord.chinese ? "default" :
                    option === selectedAnswer ? "destructive" : "outline"
                  ) : "outline"}
                  className="h-16 text-lg"
                  disabled={selectedAnswer !== null}
                >
                  {option}
                </Button>
              ))}
            </div>
            {/* Skip button spanning full width */}
            <Button
              onClick={() => !selectedAnswer && handleAnswer("跳过", true)}
              variant="secondary"
              className="h-12 text-lg w-full"
              disabled={selectedAnswer !== null}
            >
              跳过
            </Button>
          </div>

          {selectedAnswer && (
            <Alert className={selectedAnswer === currentWord.chinese ? "bg-green-50" : "bg-red-50"}>
              <AlertDescription>
                {selectedAnswer === currentWord.chinese
                  ? "正确！🎉"
                  : `错误。正确答案是：${currentWord.chinese}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between mt-6">
            <Button onClick={handleReset} variant="outline">
              重新开始
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WordGuessingGame;