const { GoogleGenerativeAI } = require("@google/generative-ai");

// تنظیمات Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function cleanMermaidCode(responseText) {
  // حذف بک‌تیک‌ها و کلمه mermaid
  let cleaned = responseText.replace(/```mermaid\s*|\s*```/g, '');
  
  // پردازش خط به خط
  let lines = cleaned.split('\n')
    .filter(line => line.trim())
    .map(line => {
      // حذف پرانتزهای تودرتو
      line = line.replace(/\((.*?)\((.*?)\)\)/, '($1 $2)');
      
      // حذف پرانتزهای اضافی داخل پرانتز اصلی
      while (line.includes('((') || line.includes('))')) {
        line = line.replace('((', '(').replace('))', ')');
      }
      
      // اطمینان از وجود فقط یک جفت پرانتز در هر بخش
      const parts = line.split('(');
      if (parts.length > 2) {
        const mainPart = parts[0];
        const contentParts = parts.slice(1).map(p => p.trim().replace(')', ''));
        line = `${mainPart}(${contentParts.join(' ')})`;
      }
      
      return line;
    });
  
  // اطمینان از شروع با mindmap
  let result = lines.join('\n');
  if (!result.trim().startsWith('mindmap')) {
    result = 'mindmap\n' + result;
  }
  
  return result;
}

function mermaidToReactflow(mermaidCode) {
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  const parentStack = [];
  
  // رنگ‌های مورد استفاده برای شاخه‌ها
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD700', 
                 '#D4A5A5', '#9FA8DA', '#80DEEA', '#FFBB00', '#A5D6A7'];
  let colorIndex = 0;
  const branchColors = {};
  let currentBranch = null;
  
  const lines = mermaidCode.split('\n');
  const radiusStep = 200;
  const levelCount = {};
  const currentLevelNodes = {};
  const levelAngles = {};
  
  // اول شاخه‌های اصلی را پیدا و رنگ‌بندی می‌کنیم
  lines.forEach(line => {
    if (!line.trim()) return;
    const indent = line.length - line.trimLeft().length;
    if (indent === 4) {
      let text = line.trim();
      if (text.includes('(')) {
        text = text.substring(text.indexOf('(') + 1, text.indexOf(')'));
      } else if (text.includes('[')) {
        text = text.substring(text.indexOf('[') + 1, text.indexOf(']'));
      }
      branchColors[text] = colors[colorIndex % colors.length];
      colorIndex++;
    }
  });
  
  // شمارش تعداد نودها در هر سطح
  lines.forEach(line => {
    if (!line.trim()) return;
    const indent = line.length - line.trimLeft().length;
    const level = Math.floor(indent / 2);
    levelCount[level] = (levelCount[level] || 0) + 1;
  });
  
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    
    const indent = line.length - line.trimLeft().length;
    const level = Math.floor(indent / 2);
    
    let text = line.trim();
    if (text.startsWith('root')) {
      text = text.match(/\((.*?)\)/)[1];
    } else if (text.includes('(')) {
      text = text.match(/\((.*?)\)/)[1];
    } else if (text.includes('[')) {
      text = text.match(/\[(.*?)\]/)[1];
    }
    
    // تعیین رنگ نود
    let nodeColor = '#1a73e8';
    
    if (indent === 4) {
      currentBranch = text;
      if (branchColors[text]) {
        nodeColor = branchColors[text];
      }
    } else if (currentBranch && branchColors[currentBranch]) {
      nodeColor = branchColors[currentBranch];
    }
    
    if (!currentLevelNodes[level]) {
      currentLevelNodes[level] = 0;
      levelAngles[level] = level > 0 ? -180 : 0;
    }
    currentLevelNodes[level]++;
    
    // محاسبه موقعیت با الگوی شعاعی
    let x = 0;
    let y = 0;
    
    if (level > 0) {
      const angleRange = level === 1 ? 360 : 180;
      const angleStep = angleRange / levelCount[level];
      const currentAngle = levelAngles[level] + (currentLevelNodes[level] - 1) * angleStep;
      
      let radius = level * radiusStep;
      if (level > 1) {
        radius *= 1.2;
      }
      
      x = radius * Math.cos(currentAngle * Math.PI / 180);
      y = radius * Math.sin(currentAngle * Math.PI / 180);
    }
    
    // ایجاد نود
    const node = {
      id: String(nodeId),
      type: 'default',
      position: { x, y },
      data: { label: text },
      style: {
        background: `${nodeColor}22`,
        border: `1px solid ${nodeColor}`,
        padding: 10,
        borderRadius: 15,
        minWidth: 120,
        fontSize: 12,
        textAlign: 'center',
        boxShadow: `0 2px 4px ${nodeColor}33`,
        color: nodeColor
      }
    };
    nodes.push(node);
    
    // ایجاد یال
    if (level > 0 && parentStack.length > 0) {
      try {
        while (parentStack.length >= level) {
          parentStack.pop();
        }
        if (parentStack.length > 0) {
          edges.push({
            id: `e${parentStack[parentStack.length - 1]}-${nodeId}`,
            source: String(parentStack[parentStack.length - 1]),
            target: String(nodeId),
            type: 'default',
            style: {
              stroke: nodeColor,
              strokeWidth: 1,
              opacity: 0.5
            }
          });
        }
      } catch (error) {
        console.error('Error creating edge:', error);
      }
    }
    
    parentStack.push(nodeId);
    nodeId++;
  });
  
  // مرکزی کردن نمودار
  if (nodes.length > 0) {
    const minX = Math.min(...nodes.map(node => node.position.x));
    const maxX = Math.max(...nodes.map(node => node.position.x));
    const minY = Math.min(...nodes.map(node => node.position.y));
    const maxY = Math.max(...nodes.map(node => node.position.y));
    
    const centerX = (maxX + minX) / 2;
    const centerY = (maxY + minY) / 2;
    
    nodes.forEach(node => {
      node.position.x -= centerX;
      node.position.y -= centerY;
    });
  }
  
  return { nodes, edges };
}

async function generateMermaidCode(inputText) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    لطفاً متن زیر را به یک نمودار ذهنی (mindmap) در Mermaid تبدیل کن. این نمودار باید:

    1.  تمام جزئیات متن را به طور کامل پوشش دهد و هیچ اطلاعات مهمی را از قلم نیندازد.
    2.  هر شاخه را با توضیحات کافی و جزئیات مرتبط پر کند، و از خلاصه شدن بیش از حد مطالب جلوگیری شود.
    3.  ساختار سلسله مراتبی با عمق مناسب (2-3 سطح) و دسته‌بندی منطقی داشته باشد.
    4.  توضیحات هر گره، جامع و کامل بوده و مرتبط با موضوع اصلی باشد.
    5.  از جملات و عبارات نسبتاً کوتاه برای توصیف هر شاخه استفاده کن تا از طولانی شدن بیش از حد آن‌ها جلوگیری شود.
    6. هر عبارت را در یک پرانتز ساده قرار بده، از پرانتز تودرتو استفاده نکن.
    
    قوانین فنی:
    - فقط کد Mermaid را برگردان.
    - کد را با دستور mindmap شروع کن.
    - از root(()) برای گره اصلی استفاده کن.
    - برای ساختار از [دسته اصلی] و (زیردسته) استفاده کن.
    - هر عبارت داخل پرانتز باید ساده باشد، بدون پرانتز اضافی.
    - هیچ توضیح اضافه یا متن دیگری اضافه نکن.

    متن برای تبدیل:
    ${inputText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (text) {
      return cleanMermaidCode(text);
    } else {
      throw new Error("پاسخی از API دریافت نشد.");
    }
  } catch (error) {
    console.error("خطا در تولید کد Mermaid:", error);
    throw error;
  }
}

exports.handler = async function(event, context) {
  // اضافه کردن پاسخ به درخواست OPTIONS برای CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // اطمینان از وجود API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { text } = requestBody;
    
    if (!text) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'متن ورودی الزامی است' })
      };
    }

    const mermaidCode = await generateMermaidCode(text);
    if (!mermaidCode) {
      throw new Error('Failed to generate Mermaid code');
    }

    const flowData = mermaidToReactflow(mermaidCode);
    if (!flowData || !flowData.nodes || !flowData.edges) {
      throw new Error('Failed to convert to React Flow format');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mermaid: mermaidCode,
        flow: flowData
      })
    };
  } catch (error) {
    console.error('Error in generate function:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}; 