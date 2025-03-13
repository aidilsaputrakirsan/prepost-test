// client/src/components/Admin/CreateQuestion.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { addQuestions, getQuizQuestions } from '../../services/api';

const CreateQuestion = () => {
  const { currentUser } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [fetchingQuestions, setFetchingQuestions] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/admin/login');
      return;
    }

    // Fetch existing questions for this quiz
    const fetchQuestions = async () => {
      try {
        setFetchingQuestions(true);
        const response = await getQuizQuestions(quizId);
        setQuestions(response.data);
      } catch (err) {
        setError('Gagal memuat pertanyaan');
      } finally {
        setFetchingQuestions(false);
      }
    };

    fetchQuestions();
  }, [currentUser, navigate, quizId]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!text.trim()) {
      setError('Pertanyaan diperlukan');
      return;
    }
    
    const validOptions = options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      setError('Minimal 2 opsi jawaban diperlukan');
      return;
    }
    
    if (correctOption >= validOptions.length) {
      setError('Pilih opsi jawaban yang benar');
      return;
    }
    
    try {
      setLoading(true);
      
      // Only include non-empty options
      const questionData = {
        text,
        options: validOptions,
        correctOption,
        timeLimit
      };
      
      await addQuestions(quizId, { questions: [questionData] });
      
      // Update questions list
      const response = await getQuizQuestions(quizId);
      setQuestions(response.data);
      
      // Reset form
      setText('');
      setOptions(['', '', '', '']);
      setCorrectOption(0);
      setTimeLimit(15);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan pertanyaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="create-question-container">
        <div className="page-header">
          <h2>Buat Pertanyaan</h2>
          <div>
            <Link to="/admin/panel" className="btn btn-secondary">
              Kembali ke Panel
            </Link>
          </div>
        </div>
        
        <div className="quiz-info">
          <p>ID Kuis: {quizId}</p>
          <p>Total Pertanyaan: {questions.length}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="text">Pertanyaan</label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="form-control"
              rows="3"
              disabled={loading}
            />
          </div>
          
          <div className="options-container">
            <label>Opsi Jawaban</label>
            {options.map((option, index) => (
              <div key={index} className="option-group">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="form-control"
                  placeholder={`Opsi ${index + 1}`}
                  disabled={loading}
                />
                <label>
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOption === index}
                    onChange={() => setCorrectOption(index)}
                    disabled={loading}
                  />
                  Jawaban Benar
                </label>
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label htmlFor="timeLimit">Batas Waktu (detik)</label>
            <input
              type="number"
              id="timeLimit"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              min="5"
              max="60"
              className="form-control"
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Tambah Pertanyaan'}
          </button>
        </form>
        
        <div className="questions-list">
          <h3>Daftar Pertanyaan</h3>
          
          {fetchingQuestions ? (
            <p>Memuat pertanyaan...</p>
          ) : questions.length === 0 ? (
            <p>Belum ada pertanyaan. Tambahkan pertanyaan untuk memulai kuis.</p>
          ) : (
            <div className="question-cards">
              {questions.map((question, index) => (
                <div key={index} className="question-card">
                  <h4>Pertanyaan {index + 1}</h4>
                  <p>{question.text}</p>
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={
                          optIndex === question.correctOption
                            ? 'option correct'
                            : 'option'
                        }
                      >
                        {option}
                        {optIndex === question.correctOption && ' (Benar)'}
                      </div>
                    ))}
                  </div>
                  <p>Waktu: {question.timeLimit} detik</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="action-buttons">
          <Link to={`/admin/participants/${quizId}`} className="btn btn-primary">
            Lihat Peserta
          </Link>
          <Link to={`/admin/control/${quizId}`} className="btn btn-success">
            Kontrol Kuis
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestion;