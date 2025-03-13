// client/src/components/Admin/CreateQuestion.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { addQuestions, getQuizQuestions } from '../../services/api';
import Loading from '../Common/Loading';

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
  const [success, setSuccess] = useState('');
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
        setQuestions(response.data?.data || []);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Gagal memuat pertanyaan. Silakan coba lagi nanti.');
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

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // Adjust correctOption if necessary
      if (correctOption === index) {
        setCorrectOption(0);
      } else if (correctOption > index) {
        setCorrectOption(correctOption - 1);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setSuccess('');
    
    // Validate
    if (!text.trim()) {
      setError('Pertanyaan diperlukan');
      return;
    }
    
    // Filter out empty options
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
      
      // Create question data with non-empty options
      const questionData = {
        text,
        options: validOptions,
        correctOption,
        timeLimit
      };
      
      await addQuestions(quizId, { questions: [questionData] });
      
      // Show success message
      setSuccess('Pertanyaan berhasil ditambahkan!');
      
      // Refetch questions
      const response = await getQuizQuestions(quizId);
      setQuestions(response.data?.data || []);
      
      // Reset form
      setText('');
      setOptions(['', '', '', '']);
      setCorrectOption(0);
      setTimeLimit(15);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error adding question:', err);
      setError(err.response?.data?.message || 'Gagal menambahkan pertanyaan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) {
      try {
        setLoading(true);
        
        // Implement API call to delete question
        // await deleteQuestion(quizId, questionId);
        
        // For now, just filter out the question from local state
        setQuestions(questions.filter(q => q._id !== questionId));
        
        setSuccess('Pertanyaan berhasil dihapus!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } catch (err) {
        console.error('Error deleting question:', err);
        setError(err.response?.data?.message || 'Gagal menghapus pertanyaan');
      } finally {
        setLoading(false);
      }
    }
  };

  if (fetchingQuestions) {
    return <Loading message="Memuat pertanyaan..." />;
  }

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
          <div>
            <p>Link untuk peserta: </p>
            <code>{window.location.origin}/join/{quizId}</code>
            <button 
              className="btn btn-sm btn-info"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${quizId}`);
                setSuccess('Link berhasil disalin!');
                setTimeout(() => setSuccess(''), 3000);
              }}
              style={{ marginLeft: '10px' }}
            >
              Salin Link
            </button>
          </div>
        </div>
        
        {success && (
          <div className="success-message" style={{
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            color: '#2ecc71',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {success}
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
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
              placeholder="Masukkan pertanyaan di sini..."
            />
          </div>
          
          <div className="options-container">
            <label>Opsi Jawaban</label>
            {options.map((option, index) => (
              <div key={index} className="option-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="form-control"
                  placeholder={`Opsi ${index + 1}`}
                  disabled={loading}
                  style={{ flex: 1 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', margin: '0 10px' }}>
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOption === index}
                    onChange={() => setCorrectOption(index)}
                    disabled={loading}
                    style={{ marginRight: '5px' }}
                  />
                  Benar
                </label>
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="btn btn-sm btn-danger"
                    disabled={loading}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="btn btn-sm btn-secondary"
                disabled={loading}
                style={{ marginTop: '5px' }}
              >
                + Tambah Opsi
              </button>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="timeLimit">Batas Waktu (detik)</label>
            <input
              type="number"
              id="timeLimit"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 15)}
              min="5"
              max="60"
              className="form-control"
              disabled={loading}
              style={{ maxWidth: '200px' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Tambah Pertanyaan'}
          </button>
        </form>
        
        <div className="questions-list">
          <h3>Daftar Pertanyaan</h3>
          
          {questions.length === 0 ? (
            <p>Belum ada pertanyaan. Tambahkan pertanyaan untuk memulai kuis.</p>
          ) : (
            <div className="question-cards">
              {questions.map((question, index) => (
                <div key={index} className="question-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Pertanyaan {index + 1}</h4>
                    <button 
                      onClick={() => handleDeleteQuestion(question._id)} 
                      className="btn btn-sm btn-danger"
                      disabled={loading}
                    >
                      Hapus
                    </button>
                  </div>
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
        
        <div className="action-buttons" style={{ marginTop: '2rem' }}>
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