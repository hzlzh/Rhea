  var Feedback = function() {
      var $fbk_content      = $('.fbk-content'),
      $fbk_reply_box        = $('.fbk-reply-box'),
      $fbk_list_body        = $('.fbk-list-body'),
      $feedback_submit_api  = '/feedback/feedback_reply',
      $feedback_list_api    = '/feedback/feedback_list',
      $feedback_support_api = '/feedback/feedback_like',
      $feedback_captcha_api = '/feedback/get_captcha',
      $feedback_reply_form  = '/rhea/feedback_reply_form';

      var is_reload = false,
        type          = 0,
        sort          = 0,
        page          = 1;

      var load_data = function(api, post_data) {
          var return_data = false;
          var dataArray   = [];

          $.ajax({
            type: 'POST',
            url: api,
            data: post_data,
            async: false,
            success: function(data) {

              if (data && data.success != false) {
                return_data = data;
              } else {}
            },
            dataType: 'json'
          });
          return return_data;
        };

      var remove_list = function($fbk_list_body) {
          $fbk_list_body.isotope('remove', $('.fbk-list-item'));
        };

      var do_list_item = function($fbk_list_body, data) {
          remove_list($fbk_list_body);
          $('.total-page').html(data.total_page);
          $('.curent-page').html(data.page);
          $('html,body').animate({
            scrollTop: 0
          }, 700);
          addItem($fbk_list_body, data.feedback)
        };

      var clear_msg = function() {
          $fbk_reply_box.find('.message').html('').slideUp();
        };

      var show_msg = function(msg) {
          $fbk_reply_box.find('.message').html(msg).slideDown();
          setTimeout(function() {
            $fbk_reply_box.find('.message').slideUp();
          }, 2000);
          $('input[name=submit]').removeAttr('disabled');
        };

      var addItem = function($fbk_list_body, data, is_reload) {

          var comment_tpl = '<li id="comment-{{id}}" class="fbk-list-item">\n \
            <div class="support-box">\n \
              <div class="support-num">\n \
                <a data-option-id="{{id}}" href="#support">\n \
                  <span>{{like_cnt}}</span>\n \
                </a>\n \
              </div>\n \
              <a data-option-id="{{id}}" class="support-text" href="#support">支持</a>\n \
            </div>\n \
            <div class="fbk-list-area">\n \
              <div class="fbk-list-content">\n \
                {{content}}\n \
                <span class="arrow-down"></span>\n \
                <span class="arrow-down-border"></span>\n \
              </div>\n \
              <div class="fbk-list-author">\n \
                用户\n \
                <span class="name">{{name}}</span>\n \
                发表于\n \
                <span class="date">{{time_created}}</span>\n \
                <span class="state {{state_class}}">{{state}}</span>\n \
              </div>\n \
              <ul class="fbk-list-reply">\n \
              {{reply}}\n \
              </ul>\n \
            </div>\n \
          </li>';

          var reply_tpl = '<li id="reply-{{id}}" class="fbk-reply-item">\n \
                        <li class="fbk-reply-item">\n \
                  <div class="fbk-reply-content">{{content}}</div>\n \
                  <div class="fbk-reply-author">\n \
                    <span class="name">{{username}}</span>\n \
                    回复于\n \
                    <span class="date">{{time_created}}</span>\n \
                  </div>\n \
                </li>';


            var data_comment = data,
            data_reply       = '',
            comment_tmp      = '',
            reply_tmp        = '';

          for (var each in data_comment) {
            var reply_list = '';
            data_reply = data_comment[each].reply;
            if (data_reply) {
              for (var index in data_reply) {
                reply_tmp  = reply_tpl.replace(/\{\{id\}\}/, data_reply[index].id);
                reply_tmp  = reply_tmp.replace(/\{\{content\}\}/, data_reply[index].content);
                reply_tmp  = reply_tmp.replace(/\{\{username\}\}/, data_reply[index].screen_name);
                reply_tmp  = reply_tmp.replace(/\{\{time_created\}\}/, data_reply[index].time_created);
                reply_list += reply_tmp;
              }
            }
            var state_class = '',
              state = '';
            if (data_comment[each].status == 1) {
              state_class = 'open';
              state       = '已采纳';
            } else if (data_comment[each].status == 2) {
              state_class = 'closed';
              state       = '已解决';
            }
            if (data_comment[each].content.substr(75) == '') comment_content = data_comment[each].content;
            else comment_content = data_comment[each].content.substr(0, 75) + '<span class="more-text">' + data_comment[each].content.substr(75) + '</span><a href="" class="more"> ... [展开]</a>';
            comment_tmp = comment_tpl.replace(/\{\{like_cnt\}\}/, data_comment[each].like_cnt);
            comment_tmp = comment_tmp.replace(/\{\{id\}\}/, data_comment[each].id);
            comment_tmp = comment_tmp.replace(/\{\{content\}\}/, comment_content);
            comment_tmp = comment_tmp.replace(/\{\{name\}\}/, data_comment[each].name);
            comment_tmp = comment_tmp.replace(/\{\{time_created\}\}/, data_comment[each].time_created);
            comment_tmp = comment_tmp.replace(/\{\{state_class\}\}/, state_class);
            comment_tmp = comment_tmp.replace(/\{\{state\}\}/, state);
            comment_tmp = comment_tmp.replace(/\{\{reply\}\}/, reply_list);

            if (is_reload) {
              // add one new item
              $fbk_list_body.prepend($(comment_tmp)).isotope('reloadItems').isotope({
                sortBy: 'original-order'
              });
            } else {
              // reload all items
              $fbk_list_body.isotope('insert', $(comment_tmp));
            }
          }
        };

      var init_cookies = function(name, key) {
          if ($.cookie(name) == null) {
            $.cookie(name, '{"' + key + '":[]}', {
              expires: 7
            });
          }
        };

      var set_cookies = function(name, key, value) {
          var support_tmp = JSON.parse($.cookie(name));
          for (var each in support_tmp) {
            support_tmp[each][support_tmp[each].length] = value;
          }
          var str = JSON.stringify(support_tmp)
          $.cookie(name, str);
        };

      var init_supported = function() {
          // init supported mark
          var supported_tag   = JSON.parse($.cookie('feedback'));
          var supported_query = '';
          for (var i = 0; i < supported_tag['supported'].length; i++) {
            supported_query += '#comment-' + supported_tag['supported'][i] + ',';
          }
          $(supported_query).find('.support-text').addClass('checked').html('已支持').end().find('.support-box').addClass('checked');
        };

      var feedback_load = function($fbk_list_body, type, sort, page) {

          var api_data = {
            "type": type,
            "sort": sort,
            "page": page
          };
          result = load_data($feedback_list_api, api_data);
          if (result) {
            do_list_item($fbk_list_body, result);
            init_supported();
            return true;
          } else {
            return false;
          }

        };
      var feedback_captcha = function() {
          $fbk_reply_box = $('.fbk-reply-box').last();
          $.get($feedback_captcha_api, function(data) {
            if (data) $fbk_reply_box.find('input[name=captcha]').val(data['captcha']);
          }, 'json');

        };

    var feedback_submit = function(type) {
      clear_msg();
      $('input[name=submit]').attr('disabled','disabled');
          var content = $.trim($fbk_reply_box.find('textarea[name=content]').val()),
          email       = $.trim($fbk_reply_box.find('input[name=email]').val()),
          url         = $.trim($fbk_reply_box.find('input[name=url]').val()),
          name        = $.trim($fbk_reply_box.find('input[name=name]').val()),
          mobile      = $.trim($fbk_reply_box.find('input[name=mobile]').val()),
          is_agree    = $fbk_reply_box.find('input[name=is_agree]').attr('checked') ? 1 : 0,
          captcha     = $.trim($fbk_reply_box.find('input[name=captcha]').val());

        var api_data = {
          "content": content,
          "email": email,
          "url": url,
          "name": name,
          "mobile": mobile,
          "is_agree": is_agree,
          "captcha": captcha
        };

          if(content.length == 0) 
            show_msg('请填写反馈内容');
          else if(content.length < 5) 
            show_msg('意见反馈至少5个字符');
          else if(content.length >1000) 
            show_msg('请将反馈正文长度控制在1000字以内');
          else if(! /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(email)) 
            show_msg('请填写格式正确的邮箱地址');
          else if(mobile != '' && !/^(1[0-9]{10})|(15[89][0-9]{8})$/.test(mobile)) 
            show_msg('请填写格式正确的手机号码');
          else if( name.length < 2 || name.length > 10 ) 
            show_msg('请将称呼长度控制在2-10字以内');
          else{
            result = load_data($feedback_submit_api, api_data);
            if(result){
              if(result.error_code == 10005){
                show_msg('请勿多页面重复提交。');
              }else if(result.error_code == 10007){
                show_msg('您的操作有些频繁，请3分钟之后再次提交反馈。');
              }else if(type == 'single'){
                // 倒计时关闭
                $('.fbk-form').fadeOut();
                $('.success-page').fadeIn();
                $('.fancybox-inner').animate({
                    height: 210
                  }, 800);
                var timeout = 10;

                function show() {
                  $('.tip-link i').html(timeout);
                  timeout--;
                  if (timeout == 0) {
                    $('.fancybox-close').trigger('click');
                  } else {
                    setTimeout(show, 1000);
                  }
                }
                show();
                $('textarea[name=content]').val('');
              }else{
                feedback_load($fbk_list_body, 0, 0, 1);
                $('textarea[name=content]').val('');
              }
              feedback_captcha();
            }
            $('input[name=submit]').removeAttr('disabled');
          }
        };

    var submit_init = function(){
      var $fbk_content = $('.fbk-content').last(),
        $fbk_reply_box = $('.fbk-reply-box').last(),
        $fbk_list_body = $('.fbk-list-body').last();



      $('input').tipsy({gravity: 's', fade: true, live: true});
        //get captcha
        feedback_captcha();
        // bind label
        $fbk_reply_box.find('.fbk-form label').bind('click', function() {
            if($('input[name=is_agree]').attr('checked') == 'checked'){
              $(this).addClass('checked');
            }
            else
              $(this).removeClass('checked');
        });


    }; 
    var placeholder = function() {
        // placeholder effect
        if (!Modernizr.input.placeholder) {
          // placeholder for IE
          $('[placeholder]').focus(function() {
            var input = $(this);
            if (input.val() == input.attr('placeholder')) {
              input.val('').parent().addClass('focus');;
              input.removeClass('placeholder');
            }
          }).blur(function() {
            var input = $(this);
            if (input.val() == '' || input.val() == input.attr('placeholder')) {
              input.addClass('placeholder').parent().removeClass('focus');;
              input.val(input.attr('placeholder'));
            }
          });

          $('[placeholder]').each(function(index) {
            if ($(this).val() == '') $(this).blur();
          });
        }
      }

    var fancybox_page = function(){
      var $submit_btn_single = $('.feedback-single input[type=submit]');
      submit_init();
        if($.trim($fbk_reply_box.find('input[name=url]').val()) == '')
            $fbk_reply_box.find('input[name=url]').val(document.URL)
      // bind submit
      $submit_btn_single.bind('click', function(event) {
        event.preventDefault();
        
        feedback_submit('single');
      });
      $fbk_reply_box.find('i.close').bind('click', function(event) {
        event.preventDefault();
        $('.fancybox-close').trigger('click');
      });

      placeholder();
    };
    var init = function() {
        // fancybox -  feedback button function
        $(".fancybox").fancybox({
          helpers: {
              title: null
          },
          padding: 0,
          margin: 0,
          width: 460,
          height: 433,
          autoSize: false,
          closeClick: false,
          scrolling: 'no',
          openEffect: 'none',
          closeEffect: 'none'
        });
    }
    var feedback_page = function() {

      var $submit_btn = $fbk_reply_box.find('input[type=submit]');
      
        // init submit
        submit_init();

        // init isotope
        $fbk_list_body.isotope({
          // options
          itemSelector: '.fbk-list-item',
          layoutMode: 'straightDown'
        });

        // set cookies for support tags
        init_cookies('feedback', 'supported');

        // init load
        feedback_load($fbk_list_body, type, sort, page);

        // init supported count
        init_supported();

        // bind sort
        $fbk_content.find('.fbk-sort a').bind('click', function(event) {
          event.preventDefault();
          sort = $(this).attr('data-option-id');
          if (feedback_load($fbk_list_body, type, sort, 1)) {
            $(this).addClass('checked').siblings().removeClass('checked');
          }
        });
        // bind type
        $fbk_content.find('.fbk-type a').bind('click', function(event) {
          event.preventDefault();
          type = $(this).attr('data-option-id');
          if(feedback_load($fbk_list_body, type, sort, 1)){
            $(this).addClass('checked').parent().siblings().find('a').removeClass('checked');
          }
        });
        // bind pagination
        $fbk_content.find('.fbk-pagination a').bind('click', function(event) {
          event.preventDefault();

          page = parseInt($('.curent-page').html());
          total_page = parseInt($('.total-page').html());
          if ($(this).hasClass('next')) i = 1;
          else i = -1;
          if (page !=1 && page != total_page) {
            if(feedback_load($fbk_list_body, type, sort, page + i))
              $('.curent-page').html(page + i);
          }else if(page == 1 && i == 1){
            if(feedback_load($fbk_list_body, type, sort, page + i))
              $('.curent-page').html(page + i);
          }else if(page == total_page && i == -1){
            if(feedback_load($fbk_list_body, type, sort, page + i))
              $('.curent-page').html(page + i);
          }
        });
        // bind support
        $fbk_content.find('.support-box').live('click', function(event) {
          event.preventDefault();

            var id       = $(this).parents().filter('li').attr('id').substr(8),
            support_cnt  = $(this).find('.support-num span'),
            support_text = $(this).find('.support-text');

          var api_data = {
            "guid": id,
          };
          if (!$(this).hasClass('checked')) {
            result = load_data($feedback_support_api, api_data);
            if (result){
            support_cnt.html(parseInt(support_cnt.html()) + 1);
            $(this).addClass('checked');
            support_text.addClass('checked').html('已支持');
            $.cookie('the_cookie', 'the_value', {
              expires: 7
            });
            set_cookies('feedback', 'id', id)
            }
          }
        });
        // bind more
        $fbk_content.find('a.more').live('click', function(event) {
          event.preventDefault();
          var text = $(this).html();
            if(text == ' ... [展开]'){
              $(this).html(' ... [收起]');          
            }else{
              $(this).html(' ... [展开]');
            }
          $(this).siblings().filter('.more-text').fadeToggle(function(){
            $fbk_list_body.isotope('reloadItems').isotope({
              sortBy: 'original-order'
            });
          });
        });
        // bind submit
        $submit_btn.bind('click', function(event) {
          event.preventDefault();
          $(this).attr('disabled','disabled');
          feedback_submit();
        });

        placeholder();
      };
    return {
      init: init,
      fancybox_page: fancybox_page,
      feedback_page: feedback_page
    }
  }();

jQuery(document).ready(function($) {
  // jQuery Plugins need
  // feedback button
  Feedback.init();
  if($('body').hasClass('feedback'))
    Feedback.feedback_page();
});