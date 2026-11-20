import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitContactMessage } from '../services/firestoreService';

export const ContactPage: React.FC = () => {
  const { firebaseUser, profile, signInWithGoogle } = useAuth();

  const [senderName, setSenderName] = useState(profile?.displayName || '');
  const [email, setEmail] = useState(firebaseUser?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentId, setSentId] = useState('');

  useEffect(() => {
    if (profile?.displayName && !senderName) setSenderName(profile.displayName);
    if (firebaseUser?.email && !email) setEmail(firebaseUser.email);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile, firebaseUser, senderName, email, phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firebaseUser) {
      setError('يرجى تسجيل الدخول بحساب Google لإرسال رسالة مسجلة في نظام الدعم.');
      return;
    }

    if (senderName.trim().length < 2 || phone.trim().length < 5 || subject.trim().length < 2 || message.trim().length < 5) {
      setError('يرجى استيفاء جميع الحقول المطلوبة بشكل صحيح.');
      return;
    }

    setSubmitting(true);
    try {
      const id = await submitContactMessage({
        senderName,
        email: email || firebaseUser.email || '',
        phone,
        subject,
        message,
      });
      setSentId(id);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الرسالة، حاول مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-orange-600 mb-2">اتصل بنا</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mb-3">
            التواصل مع فريق عمليات MH CARGO
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            للاستفسارات التشغيلية حول ميناء الإسكندرية وميناء الدخيلة، تفعيل حسابات شركات النقل، أو الدعم الفني.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Channels */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-base font-bold text-slate-950 mb-1">
                    مقر العمليات الرئيسي
                  </h2>
                  <p className="text-sm text-slate-600">
                    نطاق ميناء الإسكندرية والدخيلة، الإسكندرية، جمهورية مصر العربية
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                <Mail className="w-5 h-5 text-orange-600 shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-base font-bold text-slate-950 mb-1">
                    البريد الإلكتروني الرسمي
                  </h2>
                  <p className="font-mono text-sm text-slate-700" dir="ltr">
                    operations@mhcargo.eg
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                <Phone className="w-5 h-5 text-orange-600 shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-base font-bold text-slate-950 mb-1">
                    ساعات متابعة العمليات
                  </h2>
                  <p className="text-sm text-slate-600">
                    يومياً من السبت إلى الخميس · 8:00 صباحاً حتى 8:00 مساءً
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-7">
            {sentId ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h2 className="font-display text-xl font-bold text-slate-950 mb-2">
                  تم استلام رسالتك بنجاح
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  تم تسجيل الرسالة في لوحة الإدارة برقم مرجعي{' '}
                  <span className="font-mono text-slate-900">{sentId}</span>، وسيتم الرد عليك في أقرب وقت.
                </p>
                <button
                  type="button"
                  onClick={() => setSentId('')}
                  className="px-5 py-2.5 bg-slate-950 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {!firebaseUser && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-slate-700">
                      يرجى تسجيل الدخول بحساب Google لتوثيق رسالتك في نظام التذاكر.
                    </p>
                    <button
                      type="button"
                      onClick={() => signInWithGoogle()}
                      className="px-4 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      تسجيل الدخول بـ Google
                    </button>
                  </div>
                )}

                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="مثال: أحمد محمود"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01000000000"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      موضوع الرسالة
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="استفسار عن نقل حاوية / تفعيل حساب"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تفاصيل الرسالة
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
