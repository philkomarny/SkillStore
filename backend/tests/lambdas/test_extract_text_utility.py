"""Tests for extract_text utility function.

This test suite validates the extract_text function that will be added to
libs/skillflow-utils/skillflow_utils/gemini_utils.py as part of issue #15.

The extract_text function extracts text content from Gemini API response structure.
Currently, each Lambda imports this from gemini_connector, but we're adding a
wrapper/re-export in the shared utilities for consistency.

Test Categories:
1. Happy Path: Normal successful text extraction
2. Unexpected Events: Invalid response structures, missing fields
3. Edge Cases: Boundary conditions (marked with xfail)

Run tests:
    cd lambda_tests
    poetry run pytest tests/test_extract_text_utility.py -v
"""

from __future__ import annotations

import pytest


# =============================================================================
# HAPPY PATH TESTS - Must pass in Session 2
# =============================================================================


class TestExtractTextHappyPath:
    """Test successful text extraction from Gemini responses."""

    def test_extract_text_standard_response(self):
        """Test extraction from standard Gemini API response structure.

        Should successfully extract text from:
        response['candidates'][0]['content']['parts'][0]['text']
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': 'This is the extracted text'
                    }]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert
        assert result == 'This is the extracted text'

    def test_extract_text_json_content(self):
        """Test extraction when text contains JSON string.

        Should extract the raw JSON string without parsing it.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        json_content = '{"status": "success", "data": [1, 2, 3]}'
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': json_content
                    }]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert
        assert result == json_content
        assert isinstance(result, str)

    def test_extract_text_multiline_content(self):
        """Test extraction of multiline text content.

        Should preserve newlines and formatting in extracted text.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        multiline_text = """Line 1
Line 2
Line 3"""
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': multiline_text
                    }]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert
        assert result == multiline_text
        assert '\n' in result

    def test_extract_text_empty_string(self):
        """Test extraction when text field contains empty string.

        Should return empty string, not None or raise error.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': ''
                    }]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert
        assert result == ''
        assert isinstance(result, str)

    def test_extract_text_unicode_content(self):
        """Test extraction of Unicode text content.

        Should correctly handle emoji, special characters, etc.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        unicode_text = '{"message": "Hello 👋 世界 🌍"}'
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': unicode_text
                    }]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert
        assert result == unicode_text
        assert '👋' in result
        assert '世界' in result


# =============================================================================
# UNEXPECTED EVENTS TESTS - Must pass in Session 2
# =============================================================================


class TestExtractTextErrorHandling:
    """Test error conditions and exception handling."""

    def test_extract_text_missing_candidates_key(self):
        """Test handling when 'candidates' key is missing.

        Should raise KeyError or ValueError with clear message.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'error': 'No candidates generated'
        }

        # Act & Assert
        with pytest.raises((KeyError, ValueError)) as exc_info:
            extract_text(response)

        # Error message should mention structure issue
        error_msg = str(exc_info.value).lower()
        assert 'candidates' in error_msg or 'response structure' in error_msg or 'invalid' in error_msg

    def test_extract_text_empty_candidates_array(self):
        """Test handling when candidates array is empty.

        Should raise IndexError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': []
        }

        # Act & Assert
        with pytest.raises((IndexError, ValueError)):
            extract_text(response)

    def test_extract_text_missing_content_key(self):
        """Test handling when 'content' key is missing from candidate.

        Should raise KeyError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'finishReason': 'STOP'
                # Missing 'content' key
            }]
        }

        # Act & Assert
        with pytest.raises((KeyError, ValueError)):
            extract_text(response)

    def test_extract_text_missing_parts_key(self):
        """Test handling when 'parts' key is missing from content.

        Should raise KeyError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    # Missing 'parts' key
                    'role': 'model'
                }
            }]
        }

        # Act & Assert
        with pytest.raises((KeyError, ValueError)):
            extract_text(response)

    def test_extract_text_empty_parts_array(self):
        """Test handling when parts array is empty.

        Should raise IndexError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    'parts': []
                }
            }]
        }

        # Act & Assert
        with pytest.raises((IndexError, ValueError)):
            extract_text(response)

    def test_extract_text_missing_text_key(self):
        """Test handling when 'text' key is missing from part.

        Should raise KeyError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        # Missing 'text' key
                        'inlineData': {'mimeType': 'image/png', 'data': 'base64data'}
                    }]
                }
            }]
        }

        # Act & Assert
        with pytest.raises((KeyError, ValueError)):
            extract_text(response)

    def test_extract_text_null_response(self):
        """Test handling when None is passed as response.

        Should raise TypeError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Act & Assert
        with pytest.raises((TypeError, ValueError, AttributeError)):
            extract_text(None)

    def test_extract_text_non_dict_response(self):
        """Test handling when response is not a dictionary.

        Should raise TypeError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Act & Assert
        with pytest.raises((TypeError, KeyError, AttributeError)):
            extract_text("not a dict")

        with pytest.raises((TypeError, KeyError, AttributeError)):
            extract_text([1, 2, 3])

    def test_extract_text_candidates_not_array(self):
        """Test handling when candidates is not an array.

        Should raise TypeError or ValueError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': 'not an array'
        }

        # Act & Assert
        with pytest.raises((TypeError, IndexError, ValueError)):
            extract_text(response)

    def test_extract_text_text_field_not_string(self):
        """Test handling when text field contains non-string value.

        Should either convert to string or raise TypeError.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': 12345  # Integer instead of string
                    }]
                }
            }]
        }

        # Act - may succeed with conversion or raise TypeError
        try:
            result = extract_text(response)
            # If it converts, verify it's a string
            assert isinstance(result, str) or isinstance(result, int)
        except TypeError:
            # Also acceptable to raise TypeError
            pass


# =============================================================================
# EDGE CASES - May fail (documentary tests)
# =============================================================================


class TestExtractTextEdgeCases:
    """Edge case tests that document expected behavior but may not pass initially."""

    @pytest.mark.xfail(reason="Edge case: Multiple parts handling not specified")
    def test_extract_text_multiple_parts(self):
        """Test behavior when content has multiple parts.

        Gemini can return multiple parts (text + images, etc.).
        Should either use first part or concatenate text parts.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    'parts': [
                        {'text': 'Part 1'},
                        {'text': 'Part 2'},
                        {'text': 'Part 3'}
                    ]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert - should use first part
        assert result == 'Part 1' or result == 'Part 1Part 2Part 3'

    @pytest.mark.xfail(reason="Edge case: Very long text extraction not tested")
    def test_extract_text_very_long_content(self):
        """Test extraction of very long text (near token limit).

        Should handle responses up to maximum output tokens.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        long_text = 'x' * 100000  # 100k characters
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': long_text
                    }]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert
        assert len(result) == 100000

    @pytest.mark.xfail(reason="Edge case: Nested response structure not tested")
    def test_extract_text_deeply_nested_structure(self):
        """Test that function doesn't break with extra nesting.

        Documents robustness to API response format changes.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange - extra nesting in response
        response = {
            'response': {
                'candidates': [{
                    'content': {
                        'parts': [{
                            'text': 'nested text'
                        }]
                    }
                }]
            }
        }

        # Act & Assert - should fail with current implementation
        with pytest.raises((KeyError, ValueError)):
            extract_text(response)

    @pytest.mark.xfail(reason="Edge case: Multiple candidates handling not specified")
    def test_extract_text_multiple_candidates(self):
        """Test behavior when response contains multiple candidates.

        Should use first candidate or provide way to select.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [
                {
                    'content': {
                        'parts': [{
                            'text': 'Candidate 1 text'
                        }]
                    }
                },
                {
                    'content': {
                        'parts': [{
                            'text': 'Candidate 2 text'
                        }]
                    }
                }
            ]
        }

        # Act
        result = extract_text(response)

        # Assert - should use first candidate
        assert result == 'Candidate 1 text'

    @pytest.mark.xfail(reason="Edge case: Special characters in keys not tested")
    def test_extract_text_with_unusual_whitespace(self):
        """Test handling of unusual whitespace in text content.

        Should preserve tabs, carriage returns, etc.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        unusual_whitespace = "Line1\t\tTabbed\r\nCarriage return\n  Spaces"
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': unusual_whitespace
                    }]
                }
            }]
        }

        # Act
        result = extract_text(response)

        # Assert
        assert result == unusual_whitespace
        assert '\t' in result
        assert '\r\n' in result or '\n' in result

    @pytest.mark.xfail(reason="Edge case: Text field with None value not tested")
    def test_extract_text_null_text_value(self):
        """Test handling when text field exists but is None.

        Should handle None gracefully or raise clear error.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange
        response = {
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': None
                    }]
                }
            }]
        }

        # Act & Assert
        with pytest.raises((ValueError, TypeError)):
            extract_text(response)

    @pytest.mark.xfail(reason="Edge case: Response with safety block not handled")
    def test_extract_text_safety_blocked_response(self):
        """Test extraction when response is blocked by safety filters.

        Blocked responses may have different structure.
        """
        from skillflow_utils.gemini_utils import extract_text

        # Arrange - safety blocked response structure
        response = {
            'candidates': [{
                'finishReason': 'SAFETY',
                'safetyRatings': [
                    {
                        'category': 'HARM_CATEGORY_HARASSMENT',
                        'probability': 'HIGH'
                    }
                ]
                # No 'content' field when blocked
            }]
        }

        # Act & Assert - should raise appropriate error
        with pytest.raises((KeyError, ValueError)) as exc_info:
            extract_text(response)
        assert 'content' in str(exc_info.value).lower() or 'safety' in str(exc_info.value).lower()
