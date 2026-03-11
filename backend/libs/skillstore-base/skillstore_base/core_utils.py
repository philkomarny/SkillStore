#!/usr/bin/env python
# -*- coding: UTF-8 -*-


d_hyphens = {
    '֊': 'U+058A',
    '᠆': 'U+1806',
    '‐': 'U+2010',
    '‑': 'U+2011',
    '‒': 'U+2012',
    '–': 'U+2013',
    '—': 'U+2014',
    '―': 'U+2015',
    '⁓': 'U+2053',
    '⁻': 'U+207B',
    '₋': 'U+208B',
    '−': 'U+2212',
    '⸺': 'U+2E3A',
    '⸻': 'U+2E3B',
    '〜': 'U+301C',
    '〰': 'U+3030',
    '﹘': 'U+FE58',
    '﹣': 'U+FE63',
    '－': 'U+FF0D',
    '⁃': 'U+2043',  # Hyphen bullet
    '➖': 'U+2796',  # Heavy minus sign
    # Katakana-Hiragana prolonged sound mark (sometimes used as dash)
    'ー': 'U+30FC',
}


def isnullstr(value: any) -> bool:
    return not value or not isinstance(value, str) or not len(value)


def isnullist(value: any) -> bool:
    return not value or not isinstance(value, list) or not len(value)


def isnulldict(value: any) -> bool:
    return not value or not isinstance(value, dict) or not len(value)


def get_bool_param(event: dict, name: str) -> bool:

    value = event.get(name)

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        lowered = value.strip().lower()
        return lowered in ['true', '1', 'yes']

    return False


def sort_dict_by_key(data: dict[str, any]) -> dict[str, any]:
    """
    Return a new dictionary with keys sorted alphabetically A–Z.

    Example
    -------
    >>> sort_dict_by_key({"b": 2, "a": 1, "c": 3})
    {'a': 1, 'b': 2, 'c': 3}
    """
    return {
        k: data[k] for k in sorted(data.keys())
    }
