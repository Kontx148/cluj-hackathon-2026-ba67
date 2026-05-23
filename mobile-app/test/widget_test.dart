import 'package:flutter_test/flutter_test.dart';

import 'package:votera/main.dart';

void main() {
  testWidgets('App boots into the voting tab with both navbar tabs',
      (WidgetTester tester) async {
    await tester.pumpWidget(const CivicApp());
    await tester.pump();

    // Both navbar destinations are visible.
    expect(find.text('Vote'), findsWidgets);
    expect(find.text('Civic'), findsWidgets);

    // Voting tab headline is rendered (English default).
    expect(find.text('Vote securely'), findsOneWidget);
  });
}
