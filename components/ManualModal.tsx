
import React, { useEffect } from 'react';

interface ManualModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="neu-card text-slate-700 w-full max-w-4xl h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-5 border-b border-slate-200/50 sticky top-0 bg-[var(--neu-bg)] rounded-t-lg z-10">
                    <h2 className="text-2xl font-bold text-slate-900">Blog Canvas 사용 설명서</h2>
                    <button
                        onClick={onClose}
                        className="neu-button neu-button-icon-sm"
                        aria-label="Close manual"
                    >
                        <span className="text-xl font-light">×</span>
                    </button>
                </header>
                <main className="overflow-y-auto p-6 space-y-8">
                    <section>
                        <h3 className="text-2xl font-semibold text-slate-900 mb-3">1. 앱 개요</h3>
                        <p className="text-slate-700 leading-relaxed">
                            'Blog Canvas'는 AI 모델을 기반으로 하는 올인원 이미지 생성 및 편집 도구입니다. 이 앱을 통해 사용자는 텍스트만으로 이미지를 창조하고, 기존 이미지를 업로드하여 편집하며, 여러 이미지를 창의적으로 합성하는 등 다채로운 시각적 작업을 수행할 수 있습니다.
                        </p>
                        <p className="text-slate-700 leading-relaxed mt-2">
                            특히, 이 앱은 한의원 블로그 이미지에 초점이 맞춰져 있습니다. 간편하게 블로그 이미지를 생성하여 한의사 원장의 시간과 노력을 절약하고 효과적인 이미지를 손쉽게 얻을 수 있습니다.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-semibold text-slate-900 mb-3">2. 화면 구성</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            화면은 크게 <strong className="text-slate-800">블로그 내용 기반 작업 (왼쪽)</strong>과 <strong className="text-slate-800">이미지 직접 생성 (오른쪽)</strong>의 좌우 2단 구조로 설계되어, 작업 흐름을 직관적으로 따라갈 수 있습니다.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                                <h4 className="font-bold text-lg text-slate-800 mb-2">① 왼쪽: 블로그 제목이나 본문으로 이미지 만들기</h4>
                                <p className="text-sm text-slate-700">블로그 제목이나 본문 텍스트 '콘텐츠'를 기반으로 이미지를 생성하고 관리하는 영역입니다. 텍스트 분석, 다중 이미지 생성 및 선택, 비교 이미지 제작 등이 여기에 포함됩니다.</p>
                            </div>
                             <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                                <h4 className="font-bold text-lg text-slate-800 mb-2">② 오른쪽: 이미지 편집 및 합성</h4>
                                <p className="text-sm text-slate-700">왼쪽에서 만들었거나 PC에서 직접 업로드한 '단일 이미지'를 대상으로 세밀한 편집, 다른 이미지와의 합성, 또는 아이디어로부터의 완전한 신규 생성을 수행하는 영역입니다.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-2xl font-semibold text-slate-900 mb-3">3. 기능 상세 가이드</h3>

                        {/* --- Part 1: Left Column --- */}
                        <div className="p-4 bg-teal-50/50 rounded-lg border border-teal-200/50 space-y-6">
                            <h4 className="text-xl font-bold text-slate-800">파트 1: 콘텐츠로 이미지 만들기 (왼쪽 영역)</h4>
                            
                            <div>
                                <h5 className="font-semibold text-slate-800 text-lg mb-2">A. 제목 또는 본문으로 이미지 만들기 (⭐ 핵심 기능)</h5>
                                <p className="text-slate-700 mb-4 text-sm">블로그 제목이나 본문을 붙여넣으면, AI가 글의 맥락을 분석하여 어울리는 고품질 이미지를 한장 또는 두장 생성합니다. 이미지 개수보다는 본문과의 연관성이 더 중요합니다. 무리하게 많이 넣기 보다는 주제와 관련된 1-2장이면 충분합니다.</p>
                                <ul className="list-disc list-inside space-y-3 text-slate-700 text-sm">
                                    <li><strong>제목/본문 입력:</strong> 이미지로 만들고 싶은 블로그 제목, 본문 내용이나 핵심 문단을 붙여넣습니다.</li>
                                    <li><strong>이미지 수, 종횡비, 스타일 선택:</strong> 한 번에 생성할 이미지의 개수(최대 2개), 원하는 이미지의 종횡비(예: 16:9), 그리고 스타일(실사, 수채화 등)을 선택합니다. 선택 조건을 조합하여 글 전체를 분석하고 각기 다른 주제와 구도를 가진, 서로 연관되면서도 다양한 이미지들을 생성해줍니다. 선택이 어려울 때는 기본값을 유지하면 됩니다.</li>
                                    <li><strong>로고/이름 오버레이:</strong> '오버레이 활성화' 스위치를 켜면, 생성되는 모든 이미지에 설정된 로고와 한의원 이름을 자동으로 추가할 수 있습니다. 위치(상단/하단), 배경색, 글자색 등을 자유롭게 설정하여 일관된 브랜딩을 적용하세요.</li>
                                    <li><strong>결과 확인 및 선택:</strong> 생성된 이미지들이 아래 '본문 이미지 결과' 창에 표시됩니다.
                                        <ul className="list-['-_'] list-inside ml-6 mt-2 text-sm space-y-1">
                                            <li><strong className="text-slate-800">개별 선택:</strong> 이미지를 클릭하여 선택(파란색 테두리)하거나 선택 해제할 수 있습니다.</li>
                                            <li><strong className="text-slate-800">다중 선택:</strong> 두개 이미지를 동시에 클릭하여 선택할 수 있습니다.</li>
                                        </ul>
                                    </li>
                                    <li><strong>결과 활용:</strong>
                                        <ul className="list-['-_'] list-inside ml-6 mt-2 text-sm space-y-1">
                                            <li><strong className="text-teal-600">추가 편집:</strong> 각 이미지 위에 마우스를 올리면 나타나는 '추가 편집' 버튼을 누르면, 해당 이미지가 오른쪽 '원본 이미지' 창으로 이동하여 상세 편집을 계속할 수 있습니다.</li>
                                            <li><strong className="text-indigo-500">일괄 편집:</strong> 여러 이미지를 선택한 뒤 상단의 '일괄 편집' 버튼을 누르면, '액자/텍스트'와 같은 동일한 효과를 선택된 모든 이미지에 한 번에 적용할 수 있습니다.</li>
                                            <li><strong className="text-slate-800">저장 및 선택 취소:</strong> '선택 저장'으로 선택한 이미지만 다운로드하거나, '선택 취소'로 모든 선택을 해제할 수 있습니다.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h5 className="font-semibold text-slate-800 text-lg mb-2 mt-4">B. 검사 결과지 비교</h5>
                                <p className="text-slate-700 text-sm">치료 전/후의 검사 결과지나 X-ray 사진 등을 나란히 비교하는 이미지를 생성합니다. '이전 결과지'와 '이후 결과지'에 각각 이미지를 업로드하고, 원하는 레이아웃(세로형/가로형/정사각형)을 선택한 뒤 '비교 이미지 생성' 버튼을 누릅니다. 생성된 결과는 '본문 이미지 결과' 창에 표시됩니다.</p>
                            </div>
                        </div>

                        {/* --- Part 2: Right Column --- */}
                        <div className="p-4 mt-4 bg-teal-50/50 rounded-lg border border-teal-200/50 space-y-6">
                            <h4 className="text-xl font-bold text-slate-800">파트 2: 이미지 직접 편집 및 생성 (오른쪽 영역)</h4>
                            
                             <div>
                                <h5 className="font-semibold text-slate-800 text-lg mb-2">A. 새 이미지 생성 / 원본 이미지 업로드</h5>
                                <p className="text-slate-700 mb-4 text-sm">이 영역의 모든 작업은 '원본 이미지'를 기준으로 이루어집니다. 원본 이미지는 세 가지 방법으로 등록할 수 있습니다.</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm">
                                    <li><strong>왼쪽에서 가져오기:</strong> '본문으로 이미지 만들기' 결과물 중 하나를 선택하고 '추가 편집' 버튼을 누르면 자동으로 등록됩니다.</li>
                                    <li><strong>PC에서 업로드:</strong> '원본 이미지' 창을 클릭하여 PC의 파일을 직접 업로드합니다.</li>
                                    <li><strong>텍스트로 새로 생성:</strong> '새 이미지 생성' 패널에서 아이디어를 입력하고 이미지를 생성하면, 그 결과물이 '원본 이미지'로 자동 등록됩니다. (자세한 프롬프트 제안 기능은 왼쪽 패널의 기능 설명과 동일합니다.)</li>
                                    <li><strong>로고/이름 오버레이:</strong> 이 패널에도 '오버레이 활성화' 기능이 있어, 텍스트로 새로 생성하는 이미지에 브랜딩을 자동으로 적용할 수 있습니다.</li>
                                </ul>
                            </div>
                            
                             <div>
                                <h5 className="font-semibold text-slate-800 text-lg mb-2">B. 빠른 작업 (Quick Actions)</h5>
                                <p className="text-slate-700 mb-4 text-sm">'원본 이미지'에 대해 자주 사용하는 편집 기능을 원클릭으로 실행합니다. 생성된 결과는 '최종 편집 결과' 창에 나타납니다.</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm">
                                    <li><strong>배경 제거, 부분 삭제, 액자/텍스트, 말풍선 등:</strong> 모든 기능은 '원본 이미지'를 대상으로 작동하며, 결과물은 오른쪽 '최종 편집 결과' 창에 표시됩니다. (각 기능의 상세 설명은 왼쪽 패널의 가이드와 동일합니다.)</li>
                                </ul>
                            </div>

                             <div>
                                <h5 className="font-semibold text-slate-800 text-lg mb-2">C. 이미지 합성</h5>
                                <p className="text-slate-700 mb-4 text-sm">'원본 이미지'에 다른 '소스 이미지'들을 결합하여 새로운 결과물을 만듭니다. 강력한 '프롬프트 제안' 기능을 통해 AI가 최적의 합성 방식을 추천해줍니다.</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};