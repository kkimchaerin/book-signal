import pandas as pd
import mysql.connector
from sklearn.metrics.pairwise import cosine_similarity

# MySQL 연결 설정
def get_db_connection():
    return mysql.connector.connect(
        host="project-db-cgi.smhrd.com",
        user="book",
        password="1234",
        port=3307,
        database="book"
    )

# 추천 알고리즘 구현
def get_recommendations(user_id):
    # DB 연결
    conn = get_db_connection()
    cursor = conn.cursor()

    # 사용자별 읽은 책 및 평점 불러오기
    query = """
    SELECT mem_id, book_idx, book_score 
    FROM book_end
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    # 데이터를 pandas DataFrame으로 변환
    ratings_data = pd.DataFrame(rows, columns=['mem_id', 'book_idx', 'book_score'])

    # 사용자-아이템 행렬 생성 (피벗 테이블)
    user_item_matrix = ratings_data.pivot_table(index='mem_id', columns='book_idx', values='book_score')

    # 협업 필터링: 코사인 유사도를 기반으로 사용자에게 유사한 사용자 찾기
    user_similarity = cosine_similarity(user_item_matrix.fillna(0))

    # 유사 사용자 기반으로 추천 도서 선택
    user_index = user_item_matrix.index.get_loc(user_id)
    similar_users = pd.Series(user_similarity[user_index], index=user_item_matrix.index).sort_values(ascending=False)

    # 유사 사용자가 읽은 책 중에서 현재 사용자가 읽지 않은 책 추천
    user_ratings = user_item_matrix.loc[user_id]
    similar_users_ratings = user_item_matrix.loc[similar_users.index]

    recommended_books = similar_users_ratings.apply(
        lambda row: row[user_ratings.isna()], axis=1
    ).mean().sort_values(ascending=False).head(5)

    # 추천 도서 정보를 반환
    book_ids = recommended_books.index.tolist()
    if not book_ids:
        return []  # 추천할 책이 없으면 빈 리스트 반환

    # 추천된 책 정보 조회 및 이미지 경로 가져오기
    cursor.execute(f"SELECT book_idx, book_name, book_cover FROM book_db WHERE book_idx IN ({','.join(map(str, book_ids))})")
    book_rows = cursor.fetchall()

    # DB 연결 닫기
    conn.close()

    recommendations = [{'book_id': row[0], 
                        'book_name': row[1], 
                        'book_cover': row[2]} for row in book_rows]
    return recommendations