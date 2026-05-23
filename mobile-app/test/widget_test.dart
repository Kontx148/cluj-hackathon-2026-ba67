import 'package:flutter_test/flutter_test.dart';

import 'package:civicai/main.dart';

void main() {
  testWidgets('Feed screen shows CivicAI title', (WidgetTester tester) async {
    await tester.pumpWidget(const CivicApp());
    await tester.pumpAndSettle();

    expect(find.text('CivicAI'), findsOneWidget);
  });
}
