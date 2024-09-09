from flask import Flask, jsonify, request
from flask_cors import CORS
from recommendation_system import get_recommendations

app = Flask(__name__)
CORS(app)  # CORS 이슈 방지를 위해 CORS 활성화

@app.route('/get-recommendations', methods=['POST'])
def recommendations():
    data = request.get_json()
    user_id = data['mem_id']  # React에서 보낸 사용자 ID
    recommendations = get_recommendations(user_id)
    return jsonify(recommendations)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
