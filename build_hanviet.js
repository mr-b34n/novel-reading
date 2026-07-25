import fs from 'fs';
import { tify } from 'chinese-conv';
import { hanvietData } from 'hanviet-pinyin-words';

const dict = {};

for (const [char, pinyinMap] of Object.entries(hanvietData)) {
    for (const hvArr of Object.values(pinyinMap)) {
        if (hvArr && hvArr.length > 0) {
            dict[char] = hvArr[0];
            break;
        }
    }
}

for (let i = 0x4E00; i <= 0x9FFF; i++) {
    const simpChar = String.fromCharCode(i);
    const tradChar = tify(simpChar);
    if (tradChar !== simpChar && dict[tradChar] && !dict[simpChar]) {
        dict[simpChar] = dict[tradChar];
    }
}

// Add user's common overrides
const overrides = {
  夏: 'hạ',娇: 'kiều',珍: 'trân',珠: 'châu',珊: 'san',青: 'thanh',萧: 'tiêu',
  炎: 'viêm',海: 'hải',登: 'đăng',王: 'vương',李: 'lý',张: 'trương',刘: 'lưu',
  陈: 'trần',杨: 'dương',黄: 'hoàng',赵: 'triệu',吴: 'ngô',周: 'chu',徐: 'từ',
  孙: 'tôn',马: 'mã',朱: 'chu',胡: 'hồ',郭: 'quách',林: 'lâm',何: 'hà',高: 'cao',
  梁: 'lương',郑: 'trịnh',罗: 'la',宋: 'tống',谢: 'tạ',唐: 'đường',韩: 'hàn',
  曹: 'tào',许: 'hứa',邓: 'đặng',冯: 'phùng',曾: 'tăng',程: 'trình',蔡: 'thái',
  彭: 'bành',潘: 'phan',袁: 'viên',于: 'vu',董: 'đổng',余: 'dư',苏: 'tô',叶: 'diệp',
  吕: 'lữ',魏: 'ngụy',蒋: 'tưởng',田: 'điền',杜: 'đỗ',丁: 'đinh',沈: 'thẩm',
  姜: 'khương',范: 'phạm',江: 'giang',傅: 'phó',钟: 'chung',卢: 'lô',汪: 'uông',
  戴: 'đái',崔: 'thôi',任: 'nhậm',陆: 'lục',廖: 'liêu',姚: 'diêu',方: 'phương',
  金: 'kim',邱: 'khâu',谭: 'đàm',韦: 'vi',贾: 'giả',邹: 'trâu',石: 'thạch',
  熊: 'hùng',孟: 'mạnh',秦: 'tần',阎: 'diêm',薛: 'tiết',侯: 'hầu',雷: 'lôi',
  白: 'bạch',龙: 'long',段: 'đoạn',郝: 'hảo',孔: 'khổng',邵: 'thiệu',史: 'sử',
  顾: 'cố',万: 'vạn',覃: 'đàm',武: 'vũ',钱: 'tiền',严: 'nghiêm',莫: 'mạc',
  欧: 'âu',玲: 'linh',珑: 'lung',佩: 'bội',琪: 'kỳ',瑶: 'dao',萱: 'huyên',
  雅: 'nhã',雪: 'tuyết',霜: 'sương',月: 'nguyệt',星: 'tinh',云: 'vân',风: 'phong',
  雨: 'vũ',天: 'thiên',地: 'địa',玄: 'huyền',宇: 'vũ',宙: 'trụ',洪: 'hồng',
  荒: 'hoang',日: 'nhật',辰: 'thần',宿: 'túc',列: 'liệt',寒: 'hàn',来: 'lai',
  暑: 'thử',往: 'vãng',秋: 'thu',冬: 'đông',藏: 'tàng',娆: 'nhiêu',姿: 'tư',
  婷: 'đình',嫣: 'yên',婉: 'uyển',娴: 'nhàn',婧: 'tịnh',媛: 'viện',娜: 'na',
  娥: 'nga',姝: 'thù',媚: 'mị',婵: 'thiền',姬: 'cơ',娉: 'sính',袅: 'niểu',
  倩: 'thiến',靓: 'lượng',洁: 'khiết',颖: 'dĩnh',涵: 'hàm',馨: 'hinh',茜: 'thiến',
  蕊: 'nhị',莉: 'lỵ',芳: 'phương',芬: 'phân',茹: 'nhu',芝: 'chi',兰: 'lan',
  竹: 'trúc',菊: 'cúc',梅: 'mai',莲: 'liên',萍: 'bình',蓉: 'dung',薇: 'vi',
  蕾: 'lôi',蓓: 'bội',蔓: 'mạn',琼: 'quỳnh',琳: 'lâm',瑜: 'du',瑾: 'cẩn',
  璋: 'chương',琥: 'hổ',珀: 'phách',翡: 'phỉ',翠: 'thúy',璧: 'bích',琉: 'lưu',
  璃: 'ly',瑚: 'hô',瑛: 'anh',楠: 'nam',桂: 'quế',枫: 'phong',柳: 'liễu',
  松: 'tùng',柏: 'bách',桐: 'đồng',桃: 'đào',杏: 'hạnh',樱: 'anh',梓: 'tử',
  楚: 'sở',梦: 'mộng',楷: 'khải',楼: 'lâu',羽: 'vũ',翼: 'dực',翔: 'tường',
  翰: 'hán',翘: 'kiều',晨: 'thần',曦: 'hi',晓: 'hiểu',晖: 'huy',昊: 'hạo',
  昂: 'ngang',昌: 'xương',明: 'minh',昭: 'chiêu',晟: 'thịnh',景: 'cảnh',
  晴: 'tình',晶: 'tinh',智: 'trí',曙: 'thự',曜: 'diệu',冰: 'băng',露: 'lộ',
  霞: 'hà',雾: 'vụ',霆: 'đình',霖: 'lâm',霄: 'tiêu',霓: 'nghê',霁: 'tễ',
  沛: 'phái',泽: 'trạch',润: 'nhuận',深: 'thâm',淼: 'miểu',清: 'thanh',
  源: 'nguyên',溪: 'khê',沧: 'thương',涛: 'đào',波: 'ba',澜: 'lan',瀚: 'hãn',
  炽: 'xí',炫: 'huyễn',炳: 'bỉnh',焕: 'hoán',煜: 'dục',熙: 'hi',熠: 'dập',
  烁: 'thước',灿: 'xán',煌: 'hoàng',烨: 'diệp',熹: 'hi',逸: 'dật',宸: 'thần',
  睿: 'duệ',哲: 'triết',毅: 'nghị',杰: 'kiệt',俊: 'tuấn',伟: 'vĩ',博: 'bác',
  斌: 'bân',彬: 'bân',浩: 'hảo',然: 'nhiên',凯: 'khải',健: 'kiện',康: 'khang',
  安: 'an',平: 'bình',畅: 'xướng',福: 'phước',祥: 'tường',瑞: 'thụy',吉: 'cát',
  泰: 'thái',凤: 'phụng',鹏: 'bằng',鹤: 'hạc',鸿: 'hồng',鹰: 'ưng',蛟: 'giao'
};

for (const [k, v] of Object.entries(overrides)) {
    dict[k] = v;
}

fs.writeFileSync('src/lib/hanviet.json', JSON.stringify(dict));
console.log('Done building hanviet.json, keys:', Object.keys(dict).length);
