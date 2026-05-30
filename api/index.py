from flask import Flask, jsonify

app = Flask(__name__)

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
