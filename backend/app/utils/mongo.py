from bson import ObjectId
from typing import Any, Dict

def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively convert all MongoDB ObjectIds in a document to strings."""
    if not doc:
        return doc
    new_doc = {}
    for k, v in doc.items():
        # Convert key name if it's primary id
        key_name = "id" if k == "_id" else k
        
        if isinstance(v, ObjectId):
            new_doc[key_name] = str(v)
        elif isinstance(v, dict):
            new_doc[key_name] = serialize_doc(v)
        elif isinstance(v, list):
            new_doc[key_name] = [
                serialize_doc(item) if isinstance(item, dict)
                else (str(item) if isinstance(item, ObjectId) else item)
                for item in v
            ]
        else:
            new_doc[key_name] = v
            
    return new_doc

def serialize_list(docs: list) -> list:
    """Convert list of MongoDB documents."""
    return [serialize_doc(doc) for doc in docs if doc]

def to_object_id(id_str: str) -> ObjectId:
    """Convert string to ObjectId, return None or error if invalid."""
    try:
        return ObjectId(id_str)
    except Exception:
        return None
