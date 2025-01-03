from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import google.generativeai as genai
import re
import math
import json

app = Flask(__name__)
CORS(app)

# تنظیم Gemini API
GEMINI_API_KEY = "AIzaSyCFhGbQNX5BNAph9qcQk2uktm_Q2nLM0_I"  # جایگذاری با کلید API خود
genai.configure(api_key=GEMINI_API_KEY)

def clean_mermaid_code(response_text):
    """پاکسازی و استخراج کد Mermaid از پاسخ"""
    # حذف بک‌تیک‌ها و کلمه mermaid
    cleaned = re.sub(r'```mermaid\s*|\s*```', '', response_text)
    
    # پردازش خط به خط
    lines = []
    for line in cleaned.split('\n'):
        if line.strip():
            # حذف پرانتزهای تودرتو
            line = re.sub(r'\((.*?)\((.*?)\)\)', r'(\1 \2)', line)
            
            # حذف پرانتزهای اضافی داخل پرانتز اصلی
            while '((' in line or '))' in line:
                line = line.replace('((', '(').replace('))', ')')
            
            # اطمینان از وجود فقط یک جفت پرانتز در هر بخش
            parts = line.split('(')
            if len(parts) > 2:
                main_part = parts[0]
                content_parts = [p.strip(' )') for p in parts[1:]]
                line = f"{main_part}({' '.join(content_parts)})"
            
            lines.append(line)
    
    # اطمینان از شروع با mindmap
    result = '\n'.join(lines)
    if not result.strip().startswith('mindmap'):
        result = 'mindmap\n' + result
        
    return result

def generate_mermaid_code(input_text):
    """تبدیل متن به کد Mermaid با پوشش کامل و شاخه‌های پرمحتوا"""
    try:
        generation_config = {
            "temperature": 0.9,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=generation_config,
        )
        
        prompt = """
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
        """

        chat = model.start_chat(history=[])
        response = chat.send_message(prompt + input_text)
        
        if response.text:
            return clean_mermaid_code(response.text)
        else:
            raise Exception("پاسخی از API دریافت نشد.")

    except Exception as e:
        print(f"خطا در تولید کد Mermaid: {str(e)}")
        return None

def mermaid_to_reactflow(mermaid_code):
    """تبدیل کد Mermaid به فرمت React Flow با چیدمان شعاعی و رنگ‌بندی"""
    nodes = []
    edges = []
    node_id = 0
    parent_stack = []
    
    # رنگ‌های مورد استفاده برای شاخه‌ها
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD700', 
              '#D4A5A5', '#9FA8DA', '#80DEEA', '#FFBB00', '#A5D6A7']
    color_index = 0
    branch_colors = {}  # ذخیره رنگ هر شاخه اصلی
    current_branch = None
    
    lines = mermaid_code.split('\n')
    radius_step = 200  # فاصله هر حلقه از مرکز
    level_count = {}   # برای شمارش تعداد کل نودها در هر سطح
    current_level_nodes = {}
    level_angles = {}  # برای نگهداری زاویه شروع هر سطح
    
    import math
    
    # اول شاخه‌های اصلی را پیدا و رنگ‌بندی می‌کنیم
    for line in lines:
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        if indent == 4:  # شاخه اصلی
            text = line.strip()
            if '(' in text:
                text = text[text.find('(')+1:text.find(')')]
            elif '[' in text:
                text = text[text.find('[')+1:text.find(']')]
            branch_colors[text] = colors[color_index % len(colors)]
            color_index += 1
    
    # شمارش تعداد نودها در هر سطح
    for line in lines:
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        level = indent // 2
        if level not in level_count:
            level_count[level] = 0
        level_count[level] += 1
    
    for line in lines[1:]:
        if not line.strip():
            continue
            
        indent = len(line) - len(line.lstrip())
        level = indent // 2
        
        text = line.strip()
        if text.startswith('root'):
            text = re.findall(r'\((.*?)\)', text)[0]
        elif '(' in text:
            text = re.findall(r'\((.*?)\)', text)[0]
        elif '[' in text:
            text = re.findall(r'\[(.*?)\]', text)[0]
            
        # تعیین رنگ نود
        node_color = '#1a73e8'  # رنگ پیش‌فرض
        
        if indent == 4:  # شاخه اصلی
            current_branch = text
            if text in branch_colors:
                node_color = branch_colors[text]
        elif current_branch and current_branch in branch_colors:
            node_color = branch_colors[current_branch]
            
        if level not in current_level_nodes:
            current_level_nodes[level] = 0
            level_angles[level] = -180 if level > 0 else 0
        current_level_nodes[level] += 1
        
        # محاسبه موقعیت با الگوی شعاعی
        if level == 0:
            x = 0
            y = 0
        else:
            # محاسبه زاویه برای این نود
            angle_range = 360 if level == 1 else 180  # سطح اول 360 درجه، بقیه 180 درجه
            angle_step = angle_range / level_count[level]
            current_angle = level_angles[level] + (current_level_nodes[level] - 1) * angle_step
            
            # محاسبه موقعیت شعاعی با شعاع متغیر
            radius = level * radius_step
            if level > 1:
                radius *= 1.2  # افزایش شعاع برای سطوح بالاتر
            
            x = radius * math.cos(math.radians(current_angle))
            y = radius * math.sin(math.radians(current_angle))
        
        # ایجاد نود
        node = {
            'id': str(node_id),
            'type': 'default',
            'position': {'x': x, 'y': y},
            'data': {'label': text},
            'style': {
                'background': f'{node_color}22',  # رنگ پس‌زمینه با شفافیت
                'border': f'1px solid {node_color}',
                'padding': 10,
                'borderRadius': 15,
                'minWidth': 120,
                'fontSize': 12,
                'textAlign': 'center',
                'boxShadow': f'0 2px 4px {node_color}33',
                'color': node_color  # رنگ متن
            }
        }
        nodes.append(node)
        
        # ایجاد یال
        if level > 0 and parent_stack:
            try:
                while len(parent_stack) >= level:
                    parent_stack.pop()
                if parent_stack:
                    edges.append({
                        'id': f'e{parent_stack[-1]}-{node_id}',
                        'source': str(parent_stack[-1]),
                        'target': str(node_id),
                        'type': 'default',  # خط مستقیم برای کاهش شلوغی
                        'style': {
                            'stroke': node_color,
                            'strokeWidth': 1,
                            'opacity': 0.5
                        }
                    })
            except IndexError:
                pass
        
        parent_stack.append(node_id)
        node_id += 1
    
    # مرکزی کردن نمودار
    if nodes:
        min_x = min(node['position']['x'] for node in nodes)
        max_x = max(node['position']['x'] for node in nodes)
        min_y = min(node['position']['y'] for node in nodes)
        max_y = max(node['position']['y'] for node in nodes)
        
        center_x = (max_x + min_x) / 2
        center_y = (max_y + min_y) / 2
        
        for node in nodes:
            node['position']['x'] -= center_x
            node['position']['y'] -= center_y
    
    return {'nodes': nodes, 'edges': edges}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
            
        text = data['text']
        mermaid_code = generate_mermaid_code(text)
        
        if not mermaid_code:
            return jsonify({'error': 'Failed to generate Mermaid code'}), 500
            
        flow_data = mermaid_to_reactflow(mermaid_code)
        return jsonify(flow_data)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='169.254.107.67', port=5000, debug=True)