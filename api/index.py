from flask import Flask, send_from_directory, jsonify
import os

app = Flask(__name__, static_folder='../static', static_url_path='/static')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/api/algorithms')
def list_algorithms():
    return jsonify({
        'algorithms': [
            {'id': 'graham', 'name': "Graham's Scan", 'complexity': 'O(n log n)'},
            {'id': 'giftwrap', 'name': 'Gift Wrapping (Jarvis March)', 'complexity': 'O(nh)'},
            {'id': 'andrews', 'name': "Andrew's Monotone Chain", 'complexity': 'O(n log n)'}
        ]
    })

if __name__ == '__main__':
    app.run(debug=True)
