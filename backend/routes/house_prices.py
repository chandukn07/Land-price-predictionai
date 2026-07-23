from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest

from etl.house_prices_importer import import_house_prices

house_prices_bp = Blueprint('house_prices', __name__)


@house_prices_bp.route('/import', methods=['POST'])
def import_route():
    """POST /api/house_prices/import

    Expects JSON body with:
      - csv_path: path to the Kaggle CSV (server-accessible path)
      - name: optional dataset name

    Returns dataset info or error.
    """
    data = request.get_json() or {}
    csv_path = data.get('csv_path')
    name = data.get('name')

    if not csv_path:
        raise BadRequest('`csv_path` is required in request body')

    try:
        result = import_house_prices(csv_path, dataset_name=name)
        return jsonify({'success': True, 'data': result}), 200
    except FileNotFoundError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
