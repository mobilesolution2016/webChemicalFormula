/*
	化学式翻译器
	推荐使用16号及16以上的字体，否则显示效果不是太好
*/
;(function($) {
    var elementsDefines = [
        'H', 'D', 'T', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl',
        'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As',
        'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In',
        'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb',
        'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl',
        'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk',
        'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Uut',
        'Fl', 'Uup', 'Lv', 'Uus', 'Uuo'
    ];
	
	var elementIndices = {};
	for(var i = 0; i < elementsDefines.length; ++ i) {
		elementIndices[elementsDefines[i]] = elementsDefines[i];
		elementIndices[elementsDefines[i].toLowerCase()] = elementsDefines[i];
	}

	var ObjNone = 0;
	var ObjElement = 1;
	var ObjValue = 2;

	// 给出公式字符串，以及显示该字符串位置的字号(单位：像素)，如果不给字号，则上价显示的时候和下标是有偏移的，另外有一些特殊的效果也是不会显示的
	$.translateMolecularFormula = function(formula, fontSize) {
		var objs = [], i = 0, lastIs = ObjNone, lastSubLen = 0;
		var subSize = (fontSize || 0) * 0.4;

		while(i < formula.length) {
			var ch = formula.charAt(i);
			var chCode = formula.charCodeAt(i);

			if (chCode <= 32) {
				if (chCode == 32) {
					// 屏蔽多个连续的空格
					objs.push(' ');
					while(formula.charCodeAt(i + 1) == 32)
						i ++;
				}

				++ i;
				continue;
			}

			if (chCode >= 48 && chCode <= 57) {
				// 判断下一个是否还是数字，如果是，则继续取
				for(var k = 1; k < 8; ++ k) {
					var next = formula.charCodeAt(i + k);
					if (next < 48 || next > 57) {
						// 如果数字以^或.开头，那么后面就表示价，如果没有，那么默认为+												
						if (lastIs == ObjValue && (next == 43 || next == 45)) {
							ch = formula.substr(i, k + 1);
						} else if (lastIs == ObjValue) {
							ch = formula.substr(i, k) + '+';
							-- i;
						} else if (k > 1) {
							ch = formula.substr(i, k);
						}

						break;
					}
				}

				if (lastIs == ObjElement) {
					// 数字下标
					objs.push('<sub>' + ch + '</sub>');
					lastSubLen = ch.length;

				} else if (lastIs == ObjValue) {
					// 数字目标
					objs.push('<sup style="margin-left:-' + (lastSubLen * subSize) + 'px;">');
					objs.push((ch == '1-' || ch == '1+') ? ch.charAt(1) : ch);
					objs.push('</sup>');

				} else {
					// 普通数字
					objs.push(ch);
				}

				i += ch.length;
				lastIs = ObjNone;

			} else if ((chCode >= 97 && chCode <= 122) || (chCode >= 65 && chCode <= 90)) {
				if (lastIs == ObjValue)
					return ['使用了^或.之后，后面的符号错误: ', formula.substr(i)].join('');

				// 化学元素名称
				var maxElet = '';
				for(var k = 3; k > 0; -- k) {
					maxElet = formula.substr(i, k).toLowerCase();
					if (elementIndices[maxElet])
						break;
				}

				if (k == 0)
					return ['无法识别的化学符号在: ', formula.substr(i)].join('');

				objs.push(elementIndices[maxElet]);
				i += maxElet.length;
				lastIs = ObjElement;
				lastSubLen = 0;

			} else {
				// 数字和元素名称之外的其它符号
				if (lastIs == ObjValue)
					return ['使用了^或.之后，后面的符号错误: ', formula.substr(i)].join('');
				
				if ((chCode >= 39 && chCode <= 41) || chCode == 43 || chCode == 45) {
					// + - ( ) '
					lastSubLen = 0;
					objs.push(ch);

				} else if (chCode == 46 || chCode == 94) {
					// ^ .
					lastIs = ObjValue;
				
				} else if (chCode == 61) {
					// =
					lastSubLen = 0;
					lastIs = ObjNone;
					if (fontSize) {
						// 根据字体尺寸和等号的数量，用div模拟显示适应字体的“等于号”
						var className = fontSize >> 5, width = fontSize;
						for(var k = 1; k < 10; ++ k) {
							if (formula.charCodeAt(i + k) != 61)
								break;
							width += fontSize;
						}

						objs.push('<div class="MolecularFormula-equ' + className + '" style="height:');
						objs.push(fontSize / 3);
						objs.push('px;width:');
						objs.push(width);
						objs.push('px;"></div>');

					} else {
						// 由于未指定字体的大小，于是直接使用等于号
						for(var k = 1; k < 10; ++ k) {
							if (formula.charCodeAt(i + k) == 61)
								objs.push('=');
							else
								break;
						}

						objs.push('=');
					}

				} else if (chCode == 95) {
					// _，实现一条上下居中的横线
					objs.push('<del>&nbsp;</del>');

				} else if (chCode >= 256) {
					objs.push(ch);

				} else {
					return ['无效的符号在: ', formula.substr(i)].join('');
				}

				i += ch.length;
			}
		}

		return objs.join('');
	}

	$.fn.renderMolecularFormula = function(formula, fontSize) {
		$(document.createElement('div')).html($.translateMolecularFormula(formula, fontSize)).appendTo(this);
		return this;
	}

})(jQuery);