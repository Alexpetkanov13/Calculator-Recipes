import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Дефиниция на типа за съставка
interface Ingredient {
  id: number;
  name: string;
  quantity: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'br';
  price: string;
}

// Тип за примерна съставка (без id)
type ExampleIngredient = Omit<Ingredient, 'id'>;

// Дефиниция на данните за примерни рецепти
const exampleRecipes: { name: string, ingredients: ExampleIngredient[] }[] = [
  {
    name: 'Шопска салата',
    ingredients: [
      { name: 'Домати', quantity: '0.5', unit: 'kg', price: '3.50' },
      { name: 'Краставици', quantity: '0.4', unit: 'kg', price: '3.00' },
      { name: 'Чушки', quantity: '0.2', unit: 'kg', price: '4.00' },
      { name: 'Сирене', quantity: '0.2', unit: 'kg', price: '12.00' },
      { name: 'Лук', quantity: '0.1', unit: 'kg', price: '2.00' },
      { name: 'Магданоз', quantity: '30', unit: 'g', price: '12.00' },
      { name: 'Олио', quantity: '50', unit: 'ml', price: '4.00' },
    ],
  },
  {
    name: 'Мусака',
    ingredients: [
      { name: 'Картофи', quantity: '1', unit: 'kg', price: '2.00' },
      { name: 'Кайма', quantity: '0.5', unit: 'kg', price: '10.00' },
      { name: 'Лук', quantity: '0.2', unit: 'kg', price: '2.00' },
      { name: 'Доматено пюре', quantity: '100', unit: 'g', price: '8.00' },
      { name: 'Яйца', quantity: '4', unit: 'br', price: '0.50' },
      { name: 'Кисело мляко', quantity: '0.4', unit: 'kg', price: '3.00' },
      { name: 'Брашно', quantity: '50', unit: 'g', price: '2.00' },
      { name: 'Олио', quantity: '100', unit: 'ml', price: '4.00' },
    ]
  }
];

// Дефиниция на стъпките за урока - подобрена версия
const tutorialSteps = [
    { targetId: 'ingredients-card', title: '1. Въведете Съставки', content: 'Започнете тук, като попълните полетата за първия продукт. Въведете име, количество, мярка и единична цена.' },
    { targetId: 'add-ingredient-button', title: '2. Добавете Още', content: 'Използвайте този бутон, за да добавите още редове за останалите съставки във вашата рецепта.' },
    { targetId: 'settings-card', title: '3. Настройте Калкулацията', content: 'След като въведете съставките, задайте за колко порции е рецептата и каква надценка и ДДС да се приложат.' },
    { targetId: 'cost-analysis-card', title: '4. Анализирайте Разходите', content: 'Тази диаграма ви показва визуално коя съставка какъв дял има в общата себестойност.' },
    { targetId: 'summary-card', title: '5. Вижте Резултата', content: 'Тук се показват финалните изчисления в реално време. Веднага виждате себестойността и крайната продажна цена.' },
    { targetId: 'examples-card', title: 'Бърз Старт с Примери', content: 'Ако искате просто да тествате, можете да заредите готова рецепта от това меню като отправна точка.' },
    { targetId: 'theme-switcher', title: 'Светъл или Тъмен Режим', content: 'Превключвайте между светъл и тъмен режим за по-удобна работа по всяко време.' },
];

// Компонент за урока
const Tutorial: React.FC<{
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}> = ({ step, onNext, onPrev, onClose }) => {
  const currentStep = tutorialSteps[step];
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    const targetElement = document.getElementById(currentStep.targetId);

    const updatePosition = () => {
        const tooltip = tooltipRef.current;
        if (!targetElement || !tooltip) return;

        // On mobile, let CSS handle fixed positioning at the bottom.
        if (window.innerWidth <= 768) {
            tooltip.removeAttribute('style');
            tooltip.className = 'tutorial-tooltip';
            return;
        }

        const targetRect = targetElement.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const margin = 15;
        let top, left;
        let placement = 'bottom';

        // Vertical placement: prefer bottom, fallback to top, then to viewport top.
        if (targetRect.bottom + tooltipHeight + margin < window.innerHeight) {
            top = targetRect.bottom + margin;
            placement = 'bottom';
        } else if (targetRect.top - tooltipHeight - margin > 0) {
            top = targetRect.top - tooltipHeight - margin;
            placement = 'top';
        } else {
            top = margin;
        }

        // Horizontal placement: center align, but stay within viewport.
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        if (left < margin) left = margin;
        if (left + tooltipWidth > window.innerWidth - margin) {
            left = window.innerWidth - tooltipWidth - margin;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.transform = ''; // Clear any previous transforms

        // Position the arrow to point at the center of the target.
        const arrowEl = tooltip.querySelector('.tooltip-arrow') as HTMLDivElement;
        if (arrowEl) {
            const arrowLeft = targetRect.left + targetRect.width / 2 - left;
            arrowEl.style.left = `${arrowLeft}px`;
        }
        
        // Set class for arrow direction styling.
        tooltip.className = 'tutorial-tooltip';
        tooltip.classList.add(`tooltip-${placement}`);
    };

    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('tutorial-highlight');
        
        // Delay position update to allow scroll to finish.
        const positionTimer = setTimeout(() => {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }, 300);

        return () => {
            clearTimeout(positionTimer);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            if (targetElement) {
                targetElement.classList.remove('tutorial-highlight');
            }
        };
    }
  }, [step, currentStep.targetId]);

  if (!currentStep) return null;

  return (
    <>
      <div className="tutorial-overlay" onClick={onClose}></div>
      <div ref={tooltipRef} className="tutorial-tooltip" onClick={e => e.stopPropagation()}>
          <div className="tooltip-arrow"></div>
          <h3>{currentStep.title}</h3>
          <p>{currentStep.content}</p>
          <div className="tutorial-nav">
              <span className="step-counter">{step + 1} / {tutorialSteps.length}</span>
              <div className="nav-buttons">
                  {step > 0 && <button className="btn" onClick={onPrev}>Назад</button>}
                  {step < tutorialSteps.length - 1 ? (
                      <button className="btn btn-primary" onClick={onNext}>Напред</button>
                  ) : (
                      <button className="btn btn-primary" onClick={onClose}>Край</button>
                  )}
              </div>
          </div>
      </div>
    </>
  );
};

const safeParseFloat = (str: string) => {
    if (typeof str !== 'string') str = String(str);
    const num = parseFloat(str.replace(',', '.'));
    return isNaN(num) ? 0 : num;
};
  
const calculateIngredientCost = (ing: Ingredient) => {
    const quantity = safeParseFloat(ing.quantity);
    const price = safeParseFloat(ing.price);
    
    let multiplier = 1;
    if (ing.unit === 'g' || ing.unit === 'ml') {
      multiplier = 0.001;
    }
    
    return quantity * (ing.unit === 'br' ? 1 : multiplier) * price;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: Date.now(), name: '', quantity: '', unit: 'kg', price: '' },
  ]);
  const [selectedExample, setSelectedExample] = useState<string>('');
  const [servings, setServings] = useState<string>('10');
  const [markup, setMarkup] = useState<string>('100');
  const [vat, setVat] = useState<string>('20');
  
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const isTutorialActive = tutorialStep !== null;

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (ingredients.length > 1 || (ingredients.length === 1 && (ingredients[0].name || ingredients[0].quantity || ingredients[0].price))) {
      setSelectedExample('');
    }
  }, [ingredients]);
  

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const startTutorial = () => setTutorialStep(0);
  const closeTutorial = () => {
    setTutorialStep(null);
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
  }
  const nextStep = () => setTutorialStep(s => (s === null || s >= tutorialSteps.length - 1) ? s : s + 1);
  const prevStep = () => setTutorialStep(s => (s === null || s <= 0) ? s : s - 1);


  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const recipeName = e.target.value;
    setSelectedExample(recipeName);
    const recipe = exampleRecipes.find(r => r.name === recipeName);
    if (recipe) {
      setIngredients(
        recipe.ingredients.map((ing, index) => ({ ...ing, id: Date.now() + index }))
      );
    } else {
       setIngredients([{ id: Date.now(), name: '', quantity: '', unit: 'kg', price: '' }]);
    }
  };

  const handleIngredientChange = (id: number, field: keyof Omit<Ingredient, 'id'>, value: string) => {
    setIngredients(prevIngredients =>
      prevIngredients.map(ing =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now(), name: '', quantity: '', unit: 'kg', price: '' },
    ]);
  };

  const removeIngredient = (id: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Сигурни ли сте, че искате да изчистите всичко? Всички данни ще бъдат загубени.')) {
        setIngredients([{ id: Date.now(), name: '', quantity: '', unit: 'kg', price: '' }]);
        setServings('10');
        setMarkup('100');
        setVat('20');
        setSelectedExample('');
    }
  };

  const calculations = useMemo(() => {
    const totalCost = ingredients.reduce((total, ing) => {
        return total + calculateIngredientCost(ing);
    }, 0);

    const numServings = safeParseFloat(servings) || 1;
    const numMarkup = safeParseFloat(markup) / 100;
    const numVat = safeParseFloat(vat) / 100;

    const costPerServing = totalCost / numServings;
    const priceWithoutVat = costPerServing * (1 + numMarkup);
    const priceWithVat = priceWithoutVat * (1 + numVat);

    return { totalCost, costPerServing, priceWithoutVat, priceWithVat };
  }, [ingredients, servings, markup, vat]);

  useEffect(() => {
    const chartData = {
        labels: ingredients.map(ing => ing.name || 'Неназован'),
        datasets: [{
          data: ingredients.map(ing => calculateIngredientCost(ing)),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#C9CBCF', '#7BC225', '#FF6347', '#4682B4'
          ],
        }]
      };

    const isDark = theme === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';
    
    const getLegendPosition = () => window.innerWidth <= 768 ? 'bottom' : 'right';

    if (chartRef.current) {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.data = chartData;
            chartInstanceRef.current.options.plugins.legend.position = getLegendPosition();
            chartInstanceRef.current.options.plugins.legend.labels.color = textColor;
            chartInstanceRef.current.update('none');
        } else {
            chartInstanceRef.current = new Chart(chartRef.current, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: getLegendPosition(),
                            labels: {
                                color: textColor
                            }
                        }
                    }
                }
            });
        }
    }
    
    const handleResize = () => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.options.plugins.legend.position = getLegendPosition();
            chartInstanceRef.current.update('none');
        }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [ingredients, theme]);


  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} лв.`;
  };

  return (
    <div className="app-container">
      {isTutorialActive && <Tutorial step={tutorialStep} onNext={nextStep} onPrev={prevStep} onClose={closeTutorial} />}

      <header className="main-header">
        <button id="theme-switcher" onClick={toggleTheme} className="header-icon-btn" title="Превключване на темата" aria-label="Превключване на темата">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <h1>Калкулатор за рецепти 🇧🇬</h1>
        <button id="tutorial-button" onClick={startTutorial} className="header-icon-btn" title="Помощ">?</button>
      </header>

      <div id="examples-card" className="card">
        <h2>Примери</h2>
        <div className="example-selector">
          <label htmlFor="example-recipe">Зареди примерна рецепта</label>
          <select id="example-recipe" value={selectedExample} onChange={handleExampleChange}>
            <option value="">-- Избери --</option>
            {exampleRecipes.map(recipe => (
              <option key={recipe.name} value={recipe.name}>
                {recipe.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div id="ingredients-card" className="card">
        <h2>Съставки</h2>
        <div className="ingredients-grid">
            <div className="ingredients-header">
                <div>Име на продукта</div>
                <div>Количество</div>
                <div>Мярка</div>
                <div>Ед. цена (лв/кг/л/бр)</div>
                <div style={{textAlign: 'right', paddingRight: '10px'}}>Цена за количество</div>
                <div></div>
            </div>
          {ingredients.map((ing, index) => (
              <div key={ing.id} className="ingredient-row">
                <div className="form-field product-name-field" data-label="Име на продукта">
                  <input
                    type="text"
                    aria-label="Име на продукта"
                    className="product-name"
                    placeholder={`Продукт ${index + 1}`}
                    value={ing.name}
                    onChange={e => handleIngredientChange(ing.id, 'name', e.target.value)}
                  />
                </div>
                <div className="form-field quantity-field" data-label="Количество">
                  <input
                    type="text"
                    aria-label="Количество"
                    className="quantity"
                    placeholder="0.00"
                    value={ing.quantity}
                    onChange={e => handleIngredientChange(ing.id, 'quantity', e.target.value)}
                  />
                </div>
                <div className="form-field unit-field" data-label="Мярка">
                  <select
                    aria-label="Мярка"
                    className="unit"
                    value={ing.unit}
                    onChange={e => handleIngredientChange(ing.id, 'unit', e.target.value as Ingredient['unit'])}
                  >
                    <option value="kg">кг</option>
                    <option value="g">гр</option>
                    <option value="l">л</option>
                    <option value="ml">мл</option>
                    <option value="br">бр</option>
                  </select>
                </div>
                <div className="form-field price-field" data-label="Ед. цена">
                  <input
                    type="text"
                    aria-label="Единична цена"
                    className="price"
                    placeholder="0.00"
                    value={ing.price}
                    onChange={e => handleIngredientChange(ing.id, 'price', e.target.value)}
                  />
                </div>
                <div className="form-field price-for-quantity-field" data-label="Цена за количество">
                  <div className="price-for-quantity-wrapper">
                      <div className="price-for-quantity">{formatCurrency(calculateIngredientCost(ing))}</div>
                  </div>
                </div>
                <div className="delete-btn-wrapper">
                    <button
                    className="btn btn-danger"
                    title="Изтрий продукт"
                    onClick={() => removeIngredient(ing.id)}
                    disabled={ingredients.length <= 1}
                    aria-label="Изтрий продукт"
                    >
                    &#x1F5D1;
                    </button>
                </div>
              </div>
            ))}
        </div>
        <div className="card-actions">
            <button id="add-ingredient-button" className="btn btn-primary" onClick={addIngredient}>
            + Добави продукт
            </button>
            <button className="btn btn-outline-danger" onClick={handleClearAll}>
            Изчисти всичко
            </button>
        </div>
      </div>
      
      <div className="layout-row">
        <div id="settings-card" className="card">
            <h2>Настройки</h2>
            <div className="settings-grid">
            <div className="form-group">
                <label htmlFor="servings">Брой порции</label>
                <input
                id="servings"
                type="text"
                value={servings}
                onChange={e => setServings(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="markup">Надценка (%)</label>
                <input
                id="markup"
                type="text"
                value={markup}
                onChange={e => setMarkup(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="vat">ДДС (%)</label>
                <input
                id="vat"
                type="text"
                value={vat}
                onChange={e => setVat(e.target.value)}
                />
            </div>
            </div>
        </div>

        <div id="cost-analysis-card" className="card">
            <h2>Анализ на разходите</h2>
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
      </div>

      <div id="summary-card" className="card summary-card">
        <h2>Резюме на калкулацията</h2>
        <div className="results-grid">
            <div className="result-item">
                <span className="label">Обща себестойност (за {servings || 0} порции)</span>
                <span className="value">{formatCurrency(calculations.totalCost)}</span>
            </div>
            <div className="result-item">
                <span className="label">Себестойност (за 1 порция)</span>
                <span className="value">{formatCurrency(calculations.costPerServing)}</span>
            </div>
            <div className="result-item">
                <span className="label">Продажна цена без ДДС</span>
                <span className="value">{formatCurrency(calculations.priceWithoutVat)}</span>
            </div>
            <div className="result-item">
                <span className="label">Крайна продажна цена с ДДС</span>
                <span className="value">{formatCurrency(calculations.priceWithVat)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);